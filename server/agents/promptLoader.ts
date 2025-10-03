import { readFileSync } from 'fs';
import { join } from 'path';

export type AgentType = 'manager' | 'financial' | 'market' | 'commercial' | 'technology' | 'operations';

const agentNameMap: Record<string, AgentType> = {
  'Manager': 'manager',
  'Financial Analyst Agent': 'financial',
  'Market & Business Strategist Agent': 'market',
  'Commercial Operations Agent': 'commercial',
  'Technology & Product Agent': 'technology',
  'HR and Operations': 'operations',
};

export function loadAgentPromptsFromCSV(): Record<AgentType, string> {
  try {
    const csvPath = join(process.cwd(), 'attached_assets', 'Agent Prompts - Sheet1_1759525762806.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    const lines = csvContent.split('\n');
    const prompts: Partial<Record<AgentType, string>> = {};
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const firstCommaIndex = line.indexOf(',');
      if (firstCommaIndex === -1) continue;
      
      const agentName = line.substring(0, firstCommaIndex).trim();
      const prompt = line.substring(firstCommaIndex + 1).trim().replace(/^"|"$/g, '');
      
      const agentType = agentNameMap[agentName];
      if (agentType) {
        prompts[agentType] = prompt;
      }
    }
    
    return prompts as Record<AgentType, string>;
  } catch (error) {
    console.error('Error loading prompts from CSV:', error);
    throw new Error('Failed to load agent prompts from CSV file');
  }
}

export const AGENT_PROMPTS = loadAgentPromptsFromCSV();
