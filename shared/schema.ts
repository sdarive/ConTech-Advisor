import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const evaluations = pgTable("evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  companyUrl: text("company_url").notNull(),
  status: text("status").notNull().default("pending"),
  recommendation: text("recommendation"),
  executiveSummary: text("executive_summary"),
  agentReports: jsonb("agent_reports"),
  finalReport: jsonb("final_report"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  completedAt: timestamp("completed_at"),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  evaluationId: varchar("evaluation_id").notNull().references(() => evaluations.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: text("file_size").notNull(),
  extractedText: text("extracted_text"),
  uploadedAt: timestamp("uploaded_at").notNull().default(sql`now()`),
});

export const agentStatus = pgTable("agent_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  evaluationId: varchar("evaluation_id").notNull().references(() => evaluations.id, { onDelete: "cascade" }),
  agentName: text("agent_name").notNull(),
  status: text("status").notNull().default("pending"),
  progress: text("progress").notNull().default("0"),
  report: text("report"),
  findings: jsonb("findings"),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type Evaluation = typeof evaluations.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type AgentStatus = typeof agentStatus.$inferSelect;

export const insertEvaluationSchema = createInsertSchema(evaluations).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertAgentStatusSchema = createInsertSchema(agentStatus).omit({
  id: true,
  updatedAt: true,
});

export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertAgentStatus = z.infer<typeof insertAgentStatusSchema>;
