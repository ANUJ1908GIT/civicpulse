import { generateStructuredOutput } from "../lib/gemini";

export interface ClassificationAgentOutput {
  category: string;
  subcategory: string;
  department: string;
  tags: string[];
  issueType: string;
}

const SYSTEM_INSTRUCTION = `You are the Classification Agent of CivicPulse AI.
Your role: Categorize civic issues into the correct department and category.
Departments: Municipal Corporation, Water Department, Electricity Department, Public Works Department, Sanitation Department, Traffic Authority, Parks Department, Fire Department.
Return ONLY valid JSON.`;

export async function runClassificationAgent(
  description: string,
  visionOutput: { detectedIssue: string; infrastructureDamage: string }
): Promise<ClassificationAgentOutput> {
  const prompt = `Classify this civic issue into the correct category and department.

Description: "${description}"
Detected Issue: "${visionOutput.detectedIssue}"
Infrastructure Damage: "${visionOutput.infrastructureDamage}"

Categories: Pothole, Water Leakage, Streetlight, Waste Management, Sewage, Illegal Dumping, Road Damage, Building Hazard, Flooding, Traffic Signal, Tree Hazard, Noise Pollution, Air Quality, Graffiti, Other

Return JSON:
{
  "category": "Pothole",
  "subcategory": "Road surface crack",
  "department": "Public Works Department",
  "tags": ["road", "safety", "vehicle damage"],
  "issueType": "infrastructure"
}`;

  return generateStructuredOutput<ClassificationAgentOutput>(prompt, SYSTEM_INSTRUCTION);
}
