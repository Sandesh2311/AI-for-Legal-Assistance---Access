import type { AnalysisResult, ComparisonResult, Language, QaResult } from '../../types/legal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = (await response.json()) as { error?: string } & T;
    if (!response.ok) {
      throw new Error(payload.error || 'The AI service is unavailable. Please retry.');
    }
    return payload;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The AI request timed out. Please retry with a shorter document.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function analyzeDocument(text: string, language: Language): Promise<AnalysisResult> {
  return postJson<AnalysisResult>('/api/analyze', { text, language });
}

export function compareDocuments(documentA: string, documentB: string): Promise<ComparisonResult> {
  return postJson<ComparisonResult>('/api/compare', { documentA, documentB });
}

export function askDocumentQuestion(documentText: string, question: string): Promise<QaResult> {
  return postJson<QaResult>('/api/ask', { documentText, question });
}
