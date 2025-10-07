import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { extractTextFromPDF, extractTextFromDOCX, extractTextFromTXT, scrapeWebsite } from "./services/documentProcessor";
import { crawlCompanyWebsite, formatCrawledDataForAgents } from "./services/webCrawler";
import { runAgent, synthesizeReports } from "./services/geminiService";
import { type AgentType } from "./agents/promptLoader";
import { generateEvaluationPDF } from "./services/pdfGeneratorPuppeteer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/evaluations", async (req, res) => {
    try {
      const { companyName, companyUrl } = req.body;
      
      const evaluation = await storage.createEvaluation({
        companyName,
        companyUrl,
        status: "pending",
        recommendation: null,
        executiveSummary: null,
        agentReports: null,
        finalReport: null,
      });

      const agents: AgentType[] = ['financial', 'market', 'commercial', 'technology', 'operations'];
      for (const agentName of agents) {
        await storage.createAgentStatus({
          evaluationId: evaluation.id,
          agentName,
          status: "pending",
          progress: "0",
          report: null,
          findings: null,
        });
      }

      res.json(evaluation);
    } catch (error) {
      console.error("Error creating evaluation:", error);
      res.status(500).json({ error: "Failed to create evaluation" });
    }
  });

  app.post("/api/evaluations/:id/documents", upload.array("files"), async (req, res) => {
    try {
      const { id } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.json([]);
      }

      const documents = [];
      for (const file of files) {
        let extractedText = '';
        
        if (file.mimetype === 'application/pdf') {
          extractedText = await extractTextFromPDF(file.buffer);
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          extractedText = await extractTextFromDOCX(file.buffer);
        } else if (file.mimetype === 'text/plain') {
          extractedText = extractTextFromTXT(file.buffer);
        }

        const document = await storage.createDocument({
          evaluationId: id,
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size.toString(),
          extractedText,
        });
        
        documents.push(document);
      }

      res.json(documents);
    } catch (error) {
      console.error("Error uploading documents:", error);
      res.status(500).json({ error: "Failed to upload documents" });
    }
  });

  app.post("/api/evaluations/:id/start", async (req, res) => {
    try {
      const { id } = req.params;
      
      const evaluation = await storage.getEvaluation(id);
      if (!evaluation) {
        return res.status(404).json({ error: "Evaluation not found" });
      }

      await storage.updateEvaluation(id, { status: "analyzing" });

      res.json({ message: "Analysis started" });

      (async () => {
        try {
          let websiteData = '';
          if (evaluation.companyUrl) {
            console.log(`Starting enhanced web crawl for ${evaluation.companyUrl}...`);
            const crawledData = await crawlCompanyWebsite(evaluation.companyUrl, 10);
            websiteData = formatCrawledDataForAgents(crawledData);
            console.log('Enhanced web crawl complete');
          }

          const documents = await storage.getDocumentsByEvaluation(id);
          const documentTexts = documents.map(d => d.extractedText || '').join('\n\n');

          const context = `
Company: ${evaluation.companyName}
Website: ${evaluation.companyUrl}

${websiteData}

Supporting Documents:
${documentTexts.substring(0, 10000)}
`;

          const agents: AgentType[] = ['financial', 'market', 'commercial', 'technology', 'operations'];
          const agentStatuses = await storage.getAgentStatusByEvaluation(id);

          const agentPromises = agents.map(async (agentType) => {
            const agentStatus = agentStatuses.find(a => a.agentName === agentType);
            if (!agentStatus) return { agentType, report: '' };

            await storage.updateAgentStatus(agentStatus.id, {
              status: "analyzing",
              progress: "0",
            });

            const report = await runAgent(agentType, context, (chunk) => {
              const progress = Math.min(95, Math.floor(Math.random() * 30) + 50);
              storage.updateAgentStatus(agentStatus.id, {
                progress: progress.toString(),
              });
            });

            await storage.updateAgentStatus(agentStatus.id, {
              status: "complete",
              progress: "100",
              report,
            });

            return { agentType, report };
          });

          const agentResults = await Promise.all(agentPromises);
          const agentReports: Record<string, string> = {};
          agentResults.forEach(({ agentType, report }) => {
            agentReports[agentType] = report;
          });

          const finalReport = await synthesizeReports(context, agentReports);

          await storage.updateEvaluation(id, {
            status: "complete",
            recommendation: finalReport.recommendation,
            executiveSummary: finalReport.executiveSummary,
            agentReports: agentReports as any,
            finalReport: finalReport as any,
            completedAt: new Date(),
          });

        } catch (error) {
          console.error("Error in analysis workflow:", error);
          await storage.updateEvaluation(id, { status: "error" });
        }
      })();

    } catch (error) {
      console.error("Error starting analysis:", error);
      res.status(500).json({ error: "Failed to start analysis" });
    }
  });

  app.get("/api/evaluations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const evaluation = await storage.getEvaluation(id);
      
      if (!evaluation) {
        return res.status(404).json({ error: "Evaluation not found" });
      }

      res.json(evaluation);
    } catch (error) {
      console.error("Error getting evaluation:", error);
      res.status(500).json({ error: "Failed to get evaluation" });
    }
  });

  app.get("/api/evaluations/:id/agents", async (req, res) => {
    try {
      const { id } = req.params;
      const agentStatuses = await storage.getAgentStatusByEvaluation(id);
      res.json(agentStatuses);
    } catch (error) {
      console.error("Error getting agent statuses:", error);
      res.status(500).json({ error: "Failed to get agent statuses" });
    }
  });

  app.get("/api/evaluations/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      const evaluation = await storage.getEvaluation(id);
      
      if (!evaluation) {
        return res.status(404).json({ error: "Evaluation not found" });
      }

      if (evaluation.status !== "complete") {
        return res.status(400).json({ error: "Evaluation not yet complete" });
      }

      const pdfData = {
        companyName: evaluation.companyName,
        companyUrl: evaluation.companyUrl,
        recommendation: (evaluation.recommendation || 'caution') as 'proceed' | 'caution' | 'do-not-proceed',
        executiveSummary: evaluation.executiveSummary || '',
        sections: (evaluation.finalReport as any)?.sections || [],
        agentReports: evaluation.agentReports as any || {},
        metrics: (evaluation.finalReport as any)?.metrics || {},
        createdAt: evaluation.createdAt,
      };

      const pdfBuffer = await generateEvaluationPDF(pdfData);

      const filename = `${evaluation.companyName.replace(/[^a-z0-9]/gi, '_')}_MA_Evaluation_${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF report" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
