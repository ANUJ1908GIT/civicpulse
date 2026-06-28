import { Router } from "express";
import { db } from "@workspace/db";
import { feedItemsTable, authoritiesTable, pipelineLogsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

// Community activity feed
router.get("/community/feed", async (req, res) => {
  try {
    const items = await db.select().from(feedItemsTable).orderBy(desc(feedItemsTable.timestamp)).limit(30);
    res.json(items);
  } catch (err) {
    req.log.error({ err }, "Failed to get community feed");
    res.status(500).json({ error: "Failed to get community feed" });
  }
});

// List authorities
router.get("/authorities", async (req, res) => {
  try {
    const auths = await db.select().from(authoritiesTable).orderBy(authoritiesTable.department);

    if (auths.length === 0) {
      const defaultAuthorities = [
        { id: 1, name: "Rajesh Kumar", department: "Public Works Department", email: "publicworks@civic.gov", activeIssues: 12, resolvedThisMonth: 34, avgResponseHours: 18.5, createdAt: new Date() },
        { id: 2, name: "Priya Sharma", department: "Water Department", email: "water@civic.gov", activeIssues: 8, resolvedThisMonth: 22, avgResponseHours: 12.0, createdAt: new Date() },
        { id: 3, name: "Anand Patel", department: "Electricity Department", email: "electric@civic.gov", activeIssues: 5, resolvedThisMonth: 18, avgResponseHours: 6.5, createdAt: new Date() },
        { id: 4, name: "Meena Singh", department: "Sanitation Department", email: "sanitation@civic.gov", activeIssues: 15, resolvedThisMonth: 41, avgResponseHours: 8.0, createdAt: new Date() },
        { id: 5, name: "Vikram Nair", department: "Traffic Authority", email: "traffic@civic.gov", activeIssues: 6, resolvedThisMonth: 14, avgResponseHours: 24.0, createdAt: new Date() },
      ];
      res.json(defaultAuthorities);
    } else {
      res.json(auths);
    }
  } catch (err) {
    req.log.error({ err }, "Failed to list authorities");
    res.status(500).json({ error: "Failed to list authorities" });
  }
});

// Pipeline logs
router.get("/agents/pipeline-status", async (req, res) => {
  try {
    const logs = await db.select().from(pipelineLogsTable).orderBy(desc(pipelineLogsTable.startedAt)).limit(50);
    res.json(logs);
  } catch (err) {
    req.log.error({ err }, "Failed to get pipeline status");
    res.status(500).json({ error: "Failed to get pipeline status" });
  }
});

export default router;
