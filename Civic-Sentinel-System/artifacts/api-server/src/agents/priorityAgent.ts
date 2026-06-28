import { generateStructuredOutput } from "../lib/gemini";

export interface PriorityAgentOutput {
  urgencyScore: number;
  impactScore: number;
  riskScore: number;
  priorityScore: number;
  severity: "low" | "medium" | "high" | "critical";
  reasoning: string;
}

const SYSTEM_INSTRUCTION = `You are the Priority Agent of CivicPulse AI.
Your role: Calculate urgency, impact, and risk scores for civic issues to determine resolution priority.
Scores are 0-100. Return ONLY valid JSON.`;

export async function runPriorityAgent(
  description: string,
  visionOutput: { safetyRisks: string[]; infrastructureDamage: string; confidence: number },
  classificationOutput: { category: string; department: string },
  nearbyReportsCount: number
): Promise<PriorityAgentOutput> {
  const prompt = `Calculate priority scores for this civic issue.

Description: "${description}"
Category: ${classificationOutput.category}
Department: ${classificationOutput.department}
Safety Risks: ${visionOutput.safetyRisks.join(", ") || "None identified"}
Infrastructure Damage: ${visionOutput.infrastructureDamage}
Nearby Reports (cluster indicator): ${nearbyReportsCount}

Score each dimension (0-100):
- Urgency: How urgently does this need attention? (life/safety issues = 90+)
- Impact: How many people are affected?
- Risk: What happens if not fixed? (property damage, accidents)
- Priority: Overall weighted score

Severity: low (<30), medium (30-60), high (60-80), critical (>80)

Return JSON:
{
  "urgencyScore": 75,
  "impactScore": 65,
  "riskScore": 80,
  "priorityScore": 73,
  "severity": "high",
  "reasoning": "Large pothole in high-traffic area poses vehicle damage and accident risk"
}`;

  return generateStructuredOutput<PriorityAgentOutput>(prompt, SYSTEM_INSTRUCTION);
}
