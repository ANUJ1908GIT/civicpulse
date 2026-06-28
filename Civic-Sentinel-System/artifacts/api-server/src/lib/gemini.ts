import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

export const genai = new GoogleGenAI({ apiKey });

export const MODELS = {
  FLASH: "gemini-2.5-flash",
  PRO: "gemini-2.5-pro",
} as const;

export async function generateStructuredOutput<T>(
  prompt: string,
  systemInstruction: string,
  model = MODELS.FLASH
): Promise<T> {
  const response = await genai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    },
  });

  const text = response.text();
  if (!text) throw new Error("Empty response from Gemini");

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(cleaned) as T;
}

export async function generateStructuredOutputWithImage<T>(
  prompt: string,
  systemInstruction: string,
  imageBase64: string,
  mimeType = "image/jpeg",
  model = MODELS.FLASH
): Promise<T> {
  const response = await genai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      },
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    },
  });

  const text = response.text();
  if (!text) throw new Error("Empty response from Gemini");

  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(cleaned) as T;
}
