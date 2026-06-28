import { generateStructuredOutput } from "../lib/gemini";

export interface RoutingAgentOutput {
  assignedDepartment: string;
  escalationRequired: boolean;
  estimatedDays: number;
  escalationReason: string | null;
  contactPerson: string;
}

const SYSTEM_INSTRUCTION = `You are the Routing Agent of CivicPulse AI.
Your role: Route civic issues to the correct government authority and estimate resolution time.
Return ONLY valid JSON.`;

export async function runRoutingAgent(
  classificationOutput: { category: string; department: string },
  priorityOutput: { severity: string; priorityScore: number; urgencyScore: number },
  description: string
): Promise<RoutingAgentOutput> {
  const prompt = `Route this civic issue to the appropriate authority.

Category: ${classificationOutput.category}
Suggested Department: ${classificationOutput.department}
Severity: ${priorityOutput.severity}
Priority Score: ${priorityOutput.priorityScore}
Urgency Score: ${priorityOutput.urgencyScore}
Description: "${description}"

Available Departments:
- Municipal Corporation (general infrastructure, roads, drainage)
- Water Department (water supply, leaks, sewage)
- Electricity Department (streetlights, power lines)
- Public Works Department (roads, bridges, construction)
- Sanitation Department (waste, garbage, cleanliness)
- Traffic Authority (traffic signals, road markings)
- Parks Department (parks, trees, green spaces)
- Fire Department (urgent safety hazards)

Estimate resolution days based on severity: critical=1-3, high=3-7, medium=7-21, low=21-60

Return JSON:
{
  "assignedDepartment": "Public Works Department",
  "escalationRequired": false,
  "estimatedDays": 7,
  "escalationReason": null,
  "contactPerson": "Public Works Supervisor"
}`;

  return generateStructuredOutput<RoutingAgentOutput>(prompt, SYSTEM_INSTRUCTION);
}
