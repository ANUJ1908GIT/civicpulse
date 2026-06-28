import { generateStructuredOutput } from "../lib/gemini";

export interface GeospatialAgentOutput {
  neighborhood: string;
  nearbyReportsCount: number;
  localityContext: string;
  riskZone: string;
  urbanDensity: string;
}

const SYSTEM_INSTRUCTION = `You are the Geospatial Agent of CivicPulse AI.
Your role: Analyze location data and provide geographic intelligence for civic issues.
Return ONLY valid JSON.`;

export async function runGeospatialAgent(
  address: string | null | undefined,
  neighborhood: string | null | undefined,
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  nearbyCount: number
): Promise<GeospatialAgentOutput> {
  const locationInfo = [
    address && `Address: ${address}`,
    neighborhood && `Neighborhood: ${neighborhood}`,
    latitude && longitude && `Coordinates: ${latitude}, ${longitude}`,
  ]
    .filter(Boolean)
    .join(", ");

  const prompt = `Analyze the geographic context of this civic issue.

Location: ${locationInfo || "Unknown location"}
Nearby reports within 500m: ${nearbyCount}

Infer neighborhood name if not provided. Assess locality context and risk zone.

Return JSON:
{
  "neighborhood": "Downtown District",
  "nearbyReportsCount": ${nearbyCount},
  "localityContext": "High-traffic commercial area with aging infrastructure",
  "riskZone": "high|medium|low",
  "urbanDensity": "dense|moderate|sparse"
}`;

  return generateStructuredOutput<GeospatialAgentOutput>(prompt, SYSTEM_INSTRUCTION);
}
