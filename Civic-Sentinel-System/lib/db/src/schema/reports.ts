import { pgTable, text, serial, integer, real, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  imageBase64: text("image_base64"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  address: text("address"),
  neighborhood: text("neighborhood"),
  reporterName: text("reporter_name"),
  status: text("status").notNull().default("pending"),
  category: text("category"),
  subcategory: text("subcategory"),
  severity: text("severity").notNull().default("medium"),
  urgencyScore: real("urgency_score"),
  impactScore: real("impact_score"),
  riskScore: real("risk_score"),
  priorityScore: real("priority_score"),
  resolutionProbability: real("resolution_probability"),
  civicHealthImpact: real("civic_health_impact"),
  assignedDepartment: text("assigned_department"),
  estimatedResolutionDays: integer("estimated_resolution_days"),
  validationCount: integer("validation_count").notNull().default(0),
  upvotes: integer("upvotes").notNull().default(0),
  duplicateOfId: integer("duplicate_of_id"),
  aiAnalysis: jsonb("ai_analysis"),
  resolvedImageUrl: text("resolved_image_url"),
  resolutionNote: text("resolution_note"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
