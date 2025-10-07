import { GoogleGenerativeAI } from "@google/generative-ai";
import { AGENT_PROMPTS, type AgentType } from "../agents/promptLoader";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function runAgent(
  agentType: AgentType,
  context: string,
  onProgress?: (chunk: string) => void
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  
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
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    }
  });
  
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
2. Write a comprehensive executive summary (2-3 paragraphs minimum, well-formatted in markdown)
3. Identify key findings, synergies, and risks across all dimensions
4. Create structured sections for the final report with substantial, specific content

CRITICAL QUALITY REQUIREMENTS:
- Use proper markdown formatting (headers with ##, ###, bullet points with -, bold with **, etc.)
- Each section must have detailed, specific insights (not generic statements)
- Include concrete data points and evidence from the specialist reports
- Use bullet points and numbered lists for clarity
- Ensure executive summary is 2-3 full paragraphs with proper formatting
- All content must be production-ready with no placeholders or incomplete thoughts
- Use tables where appropriate to present structured data

IMPORTANT: Return ONLY valid JSON in your response. Do not include any explanatory text before or after the JSON.

Return your response as a single JSON object with this exact structure:
{
  "recommendation": "proceed" | "caution" | "do-not-proceed",
  "executiveSummary": "string (2-3 paragraphs in markdown format)",
  "sections": [
    {
      "id": "string (lowercase-hyphenated, e.g., 'financial-analysis')",
      "title": "string (e.g., 'Financial Analysis')",
      "content": "string (detailed markdown content with headers, bullets, bold text)",
      "subsections": [{"title": "string", "content": "string (markdown)"}]
    }
  ]
}

Example section IDs: "financial-analysis", "market-position", "commercial-operations", "technology-stack", "operational-assessment", "strategic-fit", "key-risks"

Ensure you create AT LEAST 5 sections with substantial content in each.
`;

  try {
    console.log('Starting report synthesis...');
    const result = await model.generateContent(context);
    const response = result.response.text();

    console.log('Synthesis response length:', response.length);
    console.log('First 500 chars:', response.substring(0, 500));

    // Try to extract JSON from markdown code blocks first
    const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      console.log('Found JSON in code block');
      try {
        const parsed = JSON.parse(codeBlockMatch[1]);
        console.log('Successfully parsed JSON from code block');
        return parsed;
      } catch (e) {
        console.error('Failed to parse JSON from code block:', e);
      }
    }

    // Try to find raw JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      console.log('Found raw JSON, attempting to parse...');
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed raw JSON');
        return parsed;
      } catch (e) {
        console.error('Failed to parse raw JSON:', e);
        console.error('JSON string was:', jsonMatch[0].substring(0, 500));
      }
    }

    console.error('No valid JSON found in response, returning fallback');
    console.error('Full response:', response);
    return {
      recommendation: "caution",
      executiveSummary: response.substring(0, 500) || "Unable to generate executive summary.",
      sections: []
    };
  } catch (error) {
    console.error('Error synthesizing reports:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}
