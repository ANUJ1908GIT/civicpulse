import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const feedItemsTable = pgTable("feed_items", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  reportId: integer("report_id"),
  neighborhood: text("neighborhood"),
  severity: text("severity"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertFeedItemSchema = createInsertSchema(feedItemsTable).omit({ id: true });
export type InsertFeedItem = z.infer<typeof insertFeedItemSchema>;
export type FeedItem = typeof feedItemsTable.$inferSelect;
