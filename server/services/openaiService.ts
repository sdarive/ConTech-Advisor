import OpenAI from "openai";
import { AGENT_PROMPTS, type AgentType } from "../agents/promptLoader";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runAgent(
  agentType: AgentType,
  context: string,
  onProgress?: (chunk: string) => void
): Promise<string> {
  const systemPrompt = AGENT_PROMPTS[agentType];
  
  if (!systemPrompt) {
    throw new Error(`No prompt found for agent type: ${agentType}`);
  }
  
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Context and Data:\n${context}\n\n---\n\nProvide your analysis now:` }
      ],
      stream: true,
      max_completion_tokens: 8192,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      fullResponse += text;
      if (onProgress && text) {
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
  if (!AGENT_PROMPTS.manager) {
    throw new Error('No prompt found for manager agent');
  }
  
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an M&A advisor synthesizing specialist reports." },
        { role: "user", content: context }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || '{}');
  } catch (error) {
    console.error('Error synthesizing reports:', error);
    throw error;
  }
}
