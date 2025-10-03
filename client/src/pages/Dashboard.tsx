import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CompanyInput, type UploadedFile } from "@/components/CompanyInput";
import { AgentCard, type AgentStatus } from "@/components/AgentCard";
import { AgentOrchestration } from "@/components/AgentOrchestration";
import { ReportViewer } from "@/components/ReportViewer";
import { MetricCard } from "@/components/MetricCard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  TrendingUp,
  Users,
  Code,
  Building2,
  Brain,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type WorkflowStage = "input" | "analyzing" | "complete";

export default function Dashboard() {
  const [stage, setStage] = useState<WorkflowStage>("input");
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: evaluation } = useQuery<any>({
    queryKey: ["/api/evaluations", evaluationId],
    enabled: !!evaluationId,
    refetchInterval: stage === "analyzing" ? 2000 : false,
  });

  const { data: agentStatuses = [] } = useQuery<any[]>({
    queryKey: ["/api/evaluations", evaluationId, "agents"],
    enabled: !!evaluationId,
    refetchInterval: stage === "analyzing" ? 2000 : false,
  });

  useEffect(() => {
    if (evaluation?.status === "complete") {
      setStage("complete");
    } else if (evaluation?.status === "analyzing") {
      setStage("analyzing");
    }
  }, [evaluation?.status]);

  const handleStartAnalysis = async (url: string, files: UploadedFile[]) => {
    try {
      let normalizedUrl = url.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      
      const companyName = new URL(normalizedUrl).hostname.replace("www.", "").split(".")[0];
      
      const evalRes = await apiRequest(
        "POST",
        "/api/evaluations",
        {
          companyName: companyName.charAt(0).toUpperCase() + companyName.slice(1),
          companyUrl: normalizedUrl,
        }
      );
      const evalResponse = await evalRes.json();

      setEvaluationId(evalResponse.id);

      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file: any) => {
          if (file.file) {
            formData.append("files", file.file);
          }
        });

        await fetch(`/api/evaluations/${evalResponse.id}/documents`, {
          method: "POST",
          body: formData,
        });
      }

      await apiRequest("POST", `/api/evaluations/${evalResponse.id}/start`);

      setStage("analyzing");
      
      toast({
        title: "Analysis Started",
        description: "AI agents are analyzing the company...",
      });

    } catch (error) {
      console.error("Error starting analysis:", error);
      toast({
        title: "Error",
        description: "Failed to start analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getAgentInfo = (agentName: string) => {
    const agentStatus = agentStatuses.find((a: any) => a.agentName === agentName);
    const status = (agentStatus?.status || "pending") as AgentStatus;
    const progress = parseInt(agentStatus?.progress || "0");
    
    return { status, progress };
  };

  const agents = [
    {
      id: "financial",
      name: "Financial Analyst",
      description: "Analyzes financial health, risk profile, and valuation indicators",
      ...getAgentInfo("financial"),
      findings: getAgentInfo("financial").status === "complete" ? [
        "Revenue growth and profitability analysis",
        "Cash flow and debt structure assessment",
      ] : undefined,
      icon: <DollarSign className="h-5 w-5 text-primary" />,
    },
    {
      id: "market",
      name: "Market Strategist",
      description: "Evaluates market position, competitive landscape, and growth opportunities",
      ...getAgentInfo("market"),
      findings: getAgentInfo("market").status === "complete" ? [
        "Market size and growth rate analysis",
        "Competitive positioning assessment",
      ] : undefined,
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
    },
    {
      id: "commercial",
      name: "Commercial Operations",
      description: "Assesses sales effectiveness, customer health, and revenue predictability",
      ...getAgentInfo("commercial"),
      findings: getAgentInfo("commercial").status === "complete" ? [
        "CAC and LTV metrics evaluation",
        "Customer retention analysis",
      ] : undefined,
      icon: <Users className="h-5 w-5 text-primary" />,
    },
    {
      id: "technology",
      name: "Technology & Product",
      description: "Reviews tech stack, product roadmap, and integration potential",
      ...getAgentInfo("technology"),
      findings: getAgentInfo("technology").status === "complete" ? [
        "Technology infrastructure assessment",
        "Product innovation capacity",
      ] : undefined,
      icon: <Code className="h-5 w-5 text-primary" />,
    },
    {
      id: "operations",
      name: "HR & Operations",
      description: "Examines operational scalability, leadership, and key personnel risks",
      ...getAgentInfo("operations"),
      findings: getAgentInfo("operations").status === "complete" ? [
        "Leadership team evaluation",
        "Operational scalability assessment",
      ] : undefined,
      icon: <Building2 className="h-5 w-5 text-primary" />,
    },
  ];

  const managerStatus =
    stage === "input"
      ? "idle"
      : stage === "analyzing" && agentStatuses.every((a: any) => a.status === "complete")
      ? "synthesizing"
      : stage === "analyzing"
      ? "delegating"
      : "complete";

  const reportData = evaluation?.finalReport ? {
    companyName: evaluation.companyName,
    recommendation: evaluation.recommendation || "caution",
    executiveSummary: evaluation.executiveSummary || "",
    sections: evaluation.finalReport.sections || [],
  } : null;

  const handleDownloadReport = async () => {
    if (!evaluationId) return;
    
    try {
      const response = await fetch(`/api/evaluations/${evaluationId}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${evaluation?.companyName || 'Company'}_MA_Evaluation_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Report Downloaded",
        description: "PDF report has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Contech Advisor
        </h1>
        <p className="text-muted-foreground mt-1">
          AI-powered M&A evaluation using multi-agent analysis
        </p>
      </div>

      <Tabs defaultValue="input" value={stage === "input" ? "input" : "analysis"} className="space-y-6">
        <TabsList>
          <TabsTrigger value="input" data-testid="tab-input">
            <Brain className="h-4 w-4 mr-2" />
            Input Data
          </TabsTrigger>
          <TabsTrigger value="analysis" disabled={stage === "input"} data-testid="tab-analysis">
            Analysis & Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          <CompanyInput onSubmit={handleStartAnalysis} />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <AgentOrchestration agents={agents} managerStatus={managerStatus} />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Specialist Agent Analysis</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  name={agent.name}
                  description={agent.description}
                  status={agent.status}
                  progress={agent.progress}
                  findings={agent.findings}
                  icon={agent.icon}
                />
              ))}
            </div>
          </div>

          {stage === "complete" && reportData && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Executive Report</h2>
              <ReportViewer {...reportData} onDownload={handleDownloadReport} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
