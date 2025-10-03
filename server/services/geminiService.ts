import { GoogleGenerativeAI } from "@google/generative-ai";
import { AGENT_PROMPTS, type AgentType } from "../agents/promptLoader";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function runAgent(
  agentType: AgentType,
  context: string,
  onProgress?: (chunk: string) => void
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-latest" });
  
  const systemPrompt = AGENT_PROMPTS[agentType];
  const fullPrompt = `${systemPrompt}\n\n---\n\nContext and Data:\n${context}\n\n---\n\nProvide your analysis now:`;
  
  try {
    const result = await model.generateContentStream(fullPrompt);
    
    let fullResponse = '';
    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullResponse += text;
      if (onProgress) {
        onProgress(text);
      }
    }
    
    return fullResponse;
  } catch (error) {
    console.error(`Error running ${agentType} agent:`, error);
    throw error;
  }
}

export async function synthesizeReports(
  companyData: string,
  agentReports: Record<string, string>
): Promise<{ recommendation: string; executiveSummary: string; sections: any[] }> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-latest" });
  
  const context = `
Company Data:
${companyData}

---

Specialist Agent Reports:

Financial Analysis:
${agentReports.financial || 'Not available'}

---

Market & Business Strategy:
${agentReports.market || 'Not available'}

---

Commercial Operations:
${agentReports.commercial || 'Not available'}

---

Technology & Product:
${agentReports.technology || 'Not available'}

---

HR & Operations:
${agentReports.operations || 'Not available'}

---

${AGENT_PROMPTS.manager}

Based on all the specialist reports above, synthesize a final executive report. You must:
1. Provide a clear recommendation: "proceed", "caution", or "do-not-proceed"
2. Write a comprehensive executive summary (2-3 paragraphs)
3. Identify key findings, synergies, and risks across all dimensions
4. Create structured sections for the final report

Return your response in JSON format:
{
  "recommendation": "proceed" | "caution" | "do-not-proceed",
  "executiveSummary": "string",
  "sections": [
    {
      "id": "string",
      "title": "string", 
      "content": "string",
      "subsections": [{"title": "string", "content": "string"}]
    }
  ]
}
`;

  try {
    const result = await model.generateContent(context);
    const response = result.response.text();
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {
      recommendation: "caution",
      executiveSummary: response.substring(0, 500),
      sections: []
    };
  } catch (error) {
    console.error('Error synthesizing reports:', error);
    throw error;
  }
}
