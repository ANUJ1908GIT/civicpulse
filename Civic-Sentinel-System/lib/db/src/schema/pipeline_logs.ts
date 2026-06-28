import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pipelineLogsTable = pgTable("pipeline_logs", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(),
  agentName: text("agent_name").notNull(),
  status: text("status").notNull().default("running"),
  durationMs: integer("duration_ms"),
  outputSummary: text("output_summary"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertPipelineLogSchema = createInsertSchema(pipelineLogsTable).omit({ id: true });
export type InsertPipelineLog = z.infer<typeof insertPipelineLogSchema>;
export type PipelineLog = typeof pipelineLogsTable.$inferSelect;
