import cors from 'cors';
import express from 'express';
import { compareLocally } from '../src/services/comparison/localComparison';
import { answerLocally } from '../src/services/chat/localQa';
import { analyzeLocally } from '../src/services/document/localAnalysis';
import type { AnalysisResult, ComparisonResult, QaResult } from '../src/types/legal';
import { generateJson } from './aiProvider';
import { analysisPrompt, comparisonPrompt, qaPrompt } from './prompts';
import { analyzeRequestSchema, askRequestSchema, compareRequestSchema } from './schemas';

const port = Number(process.env.PORT || 8787);

export function createServerApp(generate = generateJson) {
  const app = express();
  const responseCache = new Map<string, unknown>();

  app.use(cors({ origin: [/^http:\/\/localhost:\d+$/] }));
  app.use(express.json({ limit: '160kb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true });
  });

  app.post('/api/analyze', async (request, response) => {
    const parsed = analyzeRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: 'Please provide a supported legal document under the size limit.' });
      return;
    }
    const { text, language } = parsed.data;
    const fallback = analyzeLocally(text, language);
    const payload = await withAiFallback<AnalysisResult>(`analyze:${language}:${text}`, analysisPrompt(text, language), fallback, generate, responseCache);
    response.json(payload);
  });

  app.post('/api/compare', async (request, response) => {
    const parsed = compareRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: 'Please provide two supported documents under the size limit.' });
      return;
    }
    const { documentA, documentB } = parsed.data;
    const fallback = compareLocally(documentA, documentB);
    const payload = await withAiFallback<ComparisonResult>(`compare:${documentA}:${documentB}`, comparisonPrompt(documentA, documentB), fallback, generate, responseCache);
    response.json(payload);
  });

  app.post('/api/ask', async (request, response) => {
    const parsed = askRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: 'Please provide a document and a concise question.' });
      return;
    }
    const { documentText, question } = parsed.data;
    const fallback = answerLocally(documentText, question);
    const payload = await withAiFallback<QaResult>(`ask:${question}:${documentText}`, qaPrompt(documentText, question), fallback, generate, responseCache);
    response.json(payload);
  });

  return app;
}

async function withAiFallback<T extends { fallbackUsed: boolean }>(
  key: string,
  prompt: string,
  fallback: T,
  generate: (prompt: string) => Promise<unknown>,
  responseCache: Map<string, unknown>,
): Promise<T> {
  if (responseCache.has(key)) {
    return responseCache.get(key) as T;
  }
  try {
    const generated = (await generate(prompt)) as Partial<T>;
    const payload = { ...fallback, ...generated, fallbackUsed: false } as T;
    responseCache.set(key, payload);
    return payload;
  } catch {
    responseCache.set(key, fallback);
    return fallback;
  }
}

export const app = createServerApp();

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`LexiGuide AI API listening on http://localhost:${port}`);
  });
}
