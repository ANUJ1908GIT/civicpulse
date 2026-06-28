import { generateStructuredOutput } from "../lib/gemini";

export interface PredictiveAgentOutput {
  recurrenceRisk: number;
  hotspotPotential: boolean;
  forecastedImpact: string;
  predictedNextIssues: string[];
  neighborhoodRiskScore: number;
}

const SYSTEM_INSTRUCTION = `You are the Predictive Intelligence Agent of CivicPulse AI.
Your role: Forecast future civic risks based on current issue patterns.
Return ONLY valid JSON.`;

export async function runPredictiveAgent(
  category: string,
  neighborhood: string | null | undefined,
  nearbyReportsCount: number,
  severity: string,
  description: string
): Promise<PredictiveAgentOutput> {
  const prompt = `Predict future civic risks based on this report pattern.

Current Issue Category: ${category}
Neighborhood: ${neighborhood || "Unknown"}
Similar Nearby Reports: ${nearbyReportsCount}
Severity: ${severity}
Description: "${description}"

Analyze:
1. Recurrence risk (0-1): Will this issue recur?
2. Hotspot potential: Is this becoming a problem hotspot?
3. Forecasted impact: What happens if unresolved?
4. Predicted next issues: What related issues might emerge?
5. Neighborhood risk score (0-100): Overall neighborhood civic risk

Return JSON:
{
  "recurrenceRisk": 0.75,
  "hotspotPotential": true,
  "forecastedImpact": "Without intervention, road degradation will spread causing vehicle damage and traffic accidents",
  "predictedNextIssues": ["Road collapse", "Flooding due to drainage failure", "Increased pothole density"],
  "neighborhoodRiskScore": 68
}`;

  return generateStructuredOutput<PredictiveAgentOutput>(prompt, SYSTEM_INSTRUCTION);
}
