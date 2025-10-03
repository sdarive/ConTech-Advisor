import { 
  type Evaluation, 
  type InsertEvaluation,
  type Document,
  type InsertDocument,
  type AgentStatus,
  type InsertAgentStatus
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  getEvaluation(id: string): Promise<Evaluation | undefined>;
  updateEvaluation(id: string, data: Partial<Evaluation>): Promise<Evaluation | undefined>;
  
  createDocument(document: InsertDocument): Promise<Document>;
  getDocumentsByEvaluation(evaluationId: string): Promise<Document[]>;
  
  createAgentStatus(status: InsertAgentStatus): Promise<AgentStatus>;
  updateAgentStatus(id: string, data: Partial<AgentStatus>): Promise<AgentStatus | undefined>;
  getAgentStatusByEvaluation(evaluationId: string): Promise<AgentStatus[]>;
}

export class MemStorage implements IStorage {
  private evaluations: Map<string, Evaluation>;
  private documents: Map<string, Document>;
  private agentStatuses: Map<string, AgentStatus>;

  constructor() {
    this.evaluations = new Map();
    this.documents = new Map();
    this.agentStatuses = new Map();
  }

  async createEvaluation(insertEvaluation: InsertEvaluation): Promise<Evaluation> {
    const id = randomUUID();
    const evaluation: Evaluation = {
      id,
      companyName: insertEvaluation.companyName,
      companyUrl: insertEvaluation.companyUrl,
      status: insertEvaluation.status || "pending",
      recommendation: insertEvaluation.recommendation || null,
      executiveSummary: insertEvaluation.executiveSummary || null,
      agentReports: insertEvaluation.agentReports || null,
      finalReport: insertEvaluation.finalReport || null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.evaluations.set(id, evaluation);
    return evaluation;
  }

  async getEvaluation(id: string): Promise<Evaluation | undefined> {
    return this.evaluations.get(id);
  }

  async updateEvaluation(id: string, data: Partial<Evaluation>): Promise<Evaluation | undefined> {
    const evaluation = this.evaluations.get(id);
    if (!evaluation) return undefined;
    
    const updated = { ...evaluation, ...data };
    this.evaluations.set(id, updated);
    return updated;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      id,
      evaluationId: insertDocument.evaluationId,
      fileName: insertDocument.fileName,
      fileType: insertDocument.fileType,
      fileSize: insertDocument.fileSize,
      extractedText: insertDocument.extractedText || null,
      uploadedAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocumentsByEvaluation(evaluationId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.evaluationId === evaluationId
    );
  }

  async createAgentStatus(insertStatus: InsertAgentStatus): Promise<AgentStatus> {
    const id = randomUUID();
    const status: AgentStatus = {
      id,
      evaluationId: insertStatus.evaluationId,
      agentName: insertStatus.agentName,
      status: insertStatus.status || "pending",
      progress: insertStatus.progress || "0",
      report: insertStatus.report || null,
      findings: insertStatus.findings || null,
      updatedAt: new Date(),
    };
    this.agentStatuses.set(id, status);
    return status;
  }

  async updateAgentStatus(id: string, data: Partial<AgentStatus>): Promise<AgentStatus | undefined> {
    const status = this.agentStatuses.get(id);
    if (!status) return undefined;
    
    const updated = { ...status, ...data, updatedAt: new Date() };
    this.agentStatuses.set(id, updated);
    return updated;
  }

  async getAgentStatusByEvaluation(evaluationId: string): Promise<AgentStatus[]> {
    return Array.from(this.agentStatuses.values()).filter(
      (status) => status.evaluationId === evaluationId
    );
  }
}

export const storage = new MemStorage();
