import { pgTable, text, serial, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hotspotsTable = pgTable("hotspots", {
  id: serial("id").primaryKey(),
  neighborhood: text("neighborhood").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  riskLevel: text("risk_level").notNull().default("low"),
  predictedIssues: jsonb("predicted_issues").$type<string[]>().notNull().default([]),
  confidence: real("confidence").notNull().default(0),
  reportCount: integer("report_count").notNull().default(0),
  aiReasoning: text("ai_reasoning"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertHotspotSchema = createInsertSchema(hotspotsTable).omit({ id: true });
export type InsertHotspot = z.infer<typeof insertHotspotSchema>;
export type Hotspot = typeof hotspotsTable.$inferSelect;
