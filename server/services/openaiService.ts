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
): Promise<{ recommendation: string; executiveSummary: string; sections: any[]; metrics?: any }> {
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
  ],
  "metrics": {
    "financial": {
      "revenue": [{"label": "string", "value": number}],
      "profitability": [{"label": "string", "value": number}]
    },
    "market": {
      "position": [{"label": "string", "value": number}],
      "growth": [{"label": "string", "value": number}]
    },
    "commercial": {
      "metrics": [{"label": "string", "value": number}]
    },
    "technology": {
      "scores": [{"label": "string", "value": number}]
    },
    "operations": {
      "scores": [{"label": "string", "value": number}]
    },
    "risks": [{"category": "string", "likelihood": number (0-10), "impact": number (0-10)}],
    "scoreBreakdown": [{"label": "string", "value": number, "color": "string"}]
  }
}

IMPORTANT: Extract numeric metrics and scores from the specialist reports to populate the metrics object. For risks, assign likelihood and impact scores between 0-10 based on the analysis. For scoreBreakdown, provide an overall evaluation score breakdown across different dimensions.
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
