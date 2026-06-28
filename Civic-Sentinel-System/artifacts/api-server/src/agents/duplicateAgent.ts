import { generateStructuredOutput } from "../lib/gemini";

export interface DuplicateAgentOutput {
  isDuplicate: boolean;
  similarReportIds: number[];
  confidence: number;
  reason: string;
}

const SYSTEM_INSTRUCTION = `You are the Duplicate Detection Agent of CivicPulse AI.
Your role: Detect whether a civic report is a duplicate of existing reports.
Return ONLY valid JSON.`;

export async function runDuplicateAgent(
  newReport: { title: string; description: string; neighborhood?: string | null; category?: string | null },
  existingReports: Array<{ id: number; title: string; description: string; neighborhood?: string | null; category?: string | null }>
): Promise<DuplicateAgentOutput> {
  if (existingReports.length === 0) {
    return { isDuplicate: false, similarReportIds: [], confidence: 0.0, reason: "No existing reports to compare" };
  }

  const existingSummary = existingReports
    .slice(0, 10)
    .map((r) => `ID ${r.id}: "${r.title}" (${r.category || "unknown"}, ${r.neighborhood || "unknown"})`)
    .join("\n");

  const prompt = `Check if this new civic report is a duplicate of any existing reports.

NEW REPORT:
Title: "${newReport.title}"
Description: "${newReport.description}"
Category: ${newReport.category || "unknown"}
Neighborhood: ${newReport.neighborhood || "unknown"}

EXISTING REPORTS:
${existingSummary}

Return JSON:
{
  "isDuplicate": false,
  "similarReportIds": [],
  "confidence": 0.1,
  "reason": "No matching reports found in the same area"
}`;

  return generateStructuredOutput<DuplicateAgentOutput>(prompt, SYSTEM_INSTRUCTION);
}
