import { generateStructuredOutput, generateStructuredOutputWithImage } from "../lib/gemini";

export interface VisionAgentOutput {
  detectedIssue: string;
  safetyRisks: string[];
  infrastructureDamage: string;
  confidence: number;
  visualDescription: string;
}

const SYSTEM_INSTRUCTION = `You are the Vision Agent of CivicPulse AI — a specialized AI for analyzing civic infrastructure images.
Your role: Analyze images of public infrastructure issues and extract structured intelligence.
Return ONLY valid JSON. No markdown, no explanation.`;

export async function runVisionAgent(
  description: string,
  imageBase64?: string | null
): Promise<VisionAgentOutput> {
  const prompt = `Analyze this civic issue report and extract visual intelligence.

Report Description: "${description}"

${imageBase64 ? "An image has been attached. Analyze it carefully for:" : "No image provided. Based on description only, infer:"}
1. The specific civic issue detected
2. Safety risks present
3. Infrastructure damage severity
4. Confidence level (0-1)

Return JSON:
{
  "detectedIssue": "specific issue description",
  "safetyRisks": ["risk1", "risk2"],
  "infrastructureDamage": "none|minor|moderate|severe|critical",
  "confidence": 0.95,
  "visualDescription": "brief visual description of what is seen/inferred"
}`;

  if (imageBase64) {
    return generateStructuredOutputWithImage<VisionAgentOutput>(prompt, SYSTEM_INSTRUCTION, imageBase64);
  }
  return generateStructuredOutput<VisionAgentOutput>(prompt, SYSTEM_INSTRUCTION);
}
