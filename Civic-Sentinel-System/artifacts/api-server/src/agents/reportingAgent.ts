import { generateStructuredOutput } from "../lib/gemini";

export interface WeeklyReportOutput {
  summary: string;
  highlights: string[];
  recommendations: string[];
  departmentSummaries: Array<{
    department: string;
    summary: string;
    issuesResolved: number;
    issuesPending: number;
  }>;
  civicHealthTrend: string;
}

const SYSTEM_INSTRUCTION = `You are the Reporting Agent of CivicPulse AI.
Your role: Generate executive municipal reports for city administrators.
Return ONLY valid JSON.`;

export async function runReportingAgent(stats: {
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  criticalReports: number;
  avgResolutionDays: number;
  civicHealthScore: number;
  topCategories: string[];
  departments: Array<{ name: string; resolved: number; pending: number }>;
}): Promise<WeeklyReportOutput> {
  const prompt = `Generate an executive weekly municipal report based on these civic metrics.

Period: Last 7 days
Total Reports: ${stats.totalReports}
Resolved: ${stats.resolvedReports}
Pending: ${stats.pendingReports}
Critical Issues: ${stats.criticalReports}
Avg Resolution Time: ${stats.avgResolutionDays} days
Overall Civic Health Score: ${stats.civicHealthScore}/100
Top Issue Categories: ${stats.topCategories.join(", ")}
Department Performance:
${stats.departments.map((d) => `  - ${d.name}: ${d.resolved} resolved, ${d.pending} pending`).join("\n")}

Generate a professional executive report with:
1. A concise 2-3 sentence executive summary
2. 4-5 key highlights/achievements
3. 3-4 actionable recommendations for next week
4. Per-department summaries
5. Overall civic health trend assessment

Return JSON following the WeeklyReport schema exactly.`;

  return generateStructuredOutput<WeeklyReportOutput>(prompt, SYSTEM_INSTRUCTION);
}
