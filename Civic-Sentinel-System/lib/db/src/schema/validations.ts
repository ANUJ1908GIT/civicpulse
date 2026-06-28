import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const validationsTable = pgTable("validations", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(),
  isValid: boolean("is_valid").notNull(),
  comment: text("comment"),
  validatorName: text("validator_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertValidationSchema = createInsertSchema(validationsTable).omit({ id: true, createdAt: true });
export type InsertValidation = z.infer<typeof insertValidationSchema>;
export type Validation = typeof validationsTable.$inferSelect;
