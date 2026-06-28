import { Router } from "express";
import { db } from "@workspace/db";
import { reportsTable, feedItemsTable, validationsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import {
  ListReportsQueryParams,
  CreateReportBody,
  UpdateReportBody,
  ValidateReportBody,
  ResolveReportBody,
} from "@workspace/api-zod";
import { runFullAgentPipeline } from "../agents/pipeline";
import { logger } from "../lib/logger";

const router = Router();

// List reports
router.get("/reports", async (req, res) => {
  console.log("REPORT ROUTE HIT");
  try {
    const parsed = ListReportsQueryParams.safeParse(req.query);
    const { status, category, severity, limit = 50, offset = 0 } = parsed.success ? parsed.data : {};

    let query = db.select().from(reportsTable).$dynamic();

    const filters = [];
    if (status) filters.push(eq(reportsTable.status, status));
    if (category) filters.push(eq(reportsTable.category, category));
    if (severity) filters.push(eq(reportsTable.severity, severity));
    if (filters.length) query = query.where(and(...filters));

    const reports = await query.orderBy(desc(reportsTable.createdAt)).limit(limit).offset(offset);
    res.json(reports);
  } catch (err) {
    console.error("REPORTS ERROR:", err);
    req.log.error({ err }, "Failed to list reports");
    res.status(500).json({ error: "Failed to list reports" });
  }
});

// Create report
router.post("/reports", async (req, res) => {
  console.log("========== POST /reports HIT ==========");
  console.log(req.body);
  try {
    const parsed = CreateReportBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body", details: parsed.error });
    }

    const [report] = await db.insert(reportsTable).values({
      title: parsed.data.title,
      description: parsed.data.description,
      imageBase64: parsed.data.imageBase64 ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      address: parsed.data.address ?? null,
      neighborhood: parsed.data.neighborhood ?? null,
      reporterName: parsed.data.reporterName ?? null,
      status: "pending",
      severity: "medium",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    await db.insert(feedItemsTable).values({
      type: "report_submitted",
      message: `New report: "${report.title}" submitted${report.neighborhood ? ` in ${report.neighborhood}` : ""}`,
      reportId: report.id,
      neighborhood: report.neighborhood,
      severity: "medium",
      timestamp: new Date(),
    });

    console.log("REPORT INSERTED:", report);
    res.status(201).json(report);
  } catch (err) {
    req.log.error({ err }, "Failed to create report");
    res.status(500).json({ error: "Failed to create report" });
  }
});

// Get report
router.get("/reports/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, id));
    if (!report) return res.status(404).json({ error: "Report not found" });

    res.json(report);
  } catch (err) {
    req.log.error({ err }, "Failed to get report");
    res.status(500).json({ error: "Failed to get report" });
  }
});

// Update report
router.patch("/reports/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const parsed = UpdateReportBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error });

    const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };

    const [report] = await db.update(reportsTable).set(updates).where(eq(reportsTable.id, id)).returning();
    if (!report) return res.status(404).json({ error: "Report not found" });

    res.json(report);
  } catch (err) {
    req.log.error({ err }, "Failed to update report");
    res.status(500).json({ error: "Failed to update report" });
  }
});

// Run AI agent pipeline
router.post("/reports/:id/analyze", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const result = await runFullAgentPipeline(id);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to run agent pipeline");
    res.status(500).json({ error: String(err) });
  }
});

// Validate report
router.post("/reports/:id/validate", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const parsed = ValidateReportBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

    await db.insert(validationsTable).values({
      reportId: id,
      isValid: parsed.data.isValid,
      comment: parsed.data.comment ?? null,
      validatorName: parsed.data.validatorName ?? null,
      createdAt: new Date(),
    });

    const [current] = await db.select().from(reportsTable).where(eq(reportsTable.id, id));
    if (!current) return res.status(404).json({ error: "Report not found" });

    const newCount = current.validationCount + (parsed.data.isValid ? 1 : 0);
    const newUpvotes = current.upvotes + (parsed.data.isValid ? 1 : 0);

    const [updated] = await db.update(reportsTable).set({
      validationCount: newCount,
      upvotes: newUpvotes,
      updatedAt: new Date(),
    }).where(eq(reportsTable.id, id)).returning();

    await db.insert(feedItemsTable).values({
      type: "report_validated",
      message: `Report "${current.title}" ${parsed.data.isValid ? "validated" : "disputed"} by community member`,
      reportId: id,
      neighborhood: current.neighborhood,
      severity: current.severity,
      timestamp: new Date(),
    });

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to validate report");
    res.status(500).json({ error: "Failed to validate report" });
  }
});

// Resolve report
router.post("/reports/:id/resolve", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const parsed = ResolveReportBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

    const [current] = await db.select().from(reportsTable).where(eq(reportsTable.id, id));
    if (!current) return res.status(404).json({ error: "Report not found" });

    const [updated] = await db.update(reportsTable).set({
      status: "resolved",
      resolutionNote: parsed.data.resolutionNote,
      resolvedImageUrl: parsed.data.resolvedImageUrl ?? null,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(reportsTable.id, id)).returning();

    await db.insert(feedItemsTable).values({
      type: "report_resolved",
      message: `Issue resolved: "${current.title}" — ${parsed.data.resolutionNote}`,
      reportId: id,
      neighborhood: current.neighborhood,
      severity: current.severity,
      timestamp: new Date(),
    });

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to resolve report");
    res.status(500).json({ error: "Failed to resolve report" });
  }
});

export default router;
