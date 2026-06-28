import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const authoritiesTable = pgTable("authorities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department").notNull(),
  email: text("email"),
  activeIssues: integer("active_issues").notNull().default(0),
  resolvedThisMonth: integer("resolved_this_month").notNull().default(0),
  avgResponseHours: real("avg_response_hours").notNull().default(24),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAuthoritySchema = createInsertSchema(authoritiesTable).omit({ id: true, createdAt: true });
export type InsertAuthority = z.infer<typeof insertAuthoritySchema>;
export type Authority = typeof authoritiesTable.$inferSelect;
