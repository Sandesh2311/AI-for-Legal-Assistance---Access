import { GoogleGenerativeAI } from '@google/generative-ai';

const modelName = 'gemini-1.5-flash';

export async function generateJson(prompt: string): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('AI_NOT_CONFIGURED');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    });
    const response = await model.generateContent(prompt, { signal: controller.signal });
    const text = response.response.text();
    return parseJson(text);
  } finally {
    clearTimeout(timeout);
  }
}

function parseJson(text: string): unknown {
  const trimmed = text.trim();
  const withoutFence = trimmed.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(withoutFence);
}
