import { generateStructuredOutput } from "../lib/gemini";

export interface ResolutionAdvisorOutput {
  suggestedActions: string[];
  escalationStrategy: string;
  resolutionProbability: number;
  estimatedCost: string;
  citizenAdvice: string;
}

const SYSTEM_INSTRUCTION = `You are the Resolution Advisor Agent of CivicPulse AI.
Your role: Provide actionable resolution recommendations for civic issues.
Return ONLY valid JSON.`;

export async function runResolutionAdvisor(
  category: string,
  severity: string,
  department: string,
  description: string,
  estimatedDays: number
): Promise<ResolutionAdvisorOutput> {
  const prompt = `Generate resolution recommendations for this civic issue.

Category: ${category}
Severity: ${severity}
Assigned Department: ${department}
Estimated Resolution: ${estimatedDays} days
Description: "${description}"

Provide:
1. 3-5 specific action steps for the authority
2. Escalation strategy if not resolved within deadline
3. Resolution probability (0-1) based on issue type and severity
4. Estimated cost range
5. Advice for the citizen on what to expect

Return JSON:
{
  "suggestedActions": [
    "Dispatch road maintenance crew within 24 hours",
    "Set up safety barriers and warning signs immediately",
    "Schedule full road surface inspection of the block",
    "File work order for complete pothole patching",
    "Schedule follow-up inspection in 72 hours"
  ],
  "escalationStrategy": "If not resolved within 7 days, escalate to Municipal Commissioner with photographic evidence",
  "resolutionProbability": 0.85,
  "estimatedCost": "$500-$2,000",
  "citizenAdvice": "Your report has been assigned to Public Works. Expect initial response within 48 hours. You will receive SMS updates."
}`;

  return generateStructuredOutput<ResolutionAdvisorOutput>(prompt, SYSTEM_INSTRUCTION);
}
