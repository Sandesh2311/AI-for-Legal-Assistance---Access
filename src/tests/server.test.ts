import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createServerApp } from '../../server/index';
import { analysisPayload, comparisonPayload, qaPayload, validDocument } from './fixtures';

describe('server API boundary', () => {
  it('returns health status', async () => {
    await request(createServerApp()).get('/api/health').expect(200, { ok: true });
  });

  it('validates malformed analysis, comparison, and ask payloads', async () => {
    const app = createServerApp();

    await request(app).post('/api/analyze').send({ text: '', language: 'English' }).expect(400).expect(({ body }) => {
      expect(body.error).toContain('supported legal document');
    });
    await request(app).post('/api/compare').send({ documentA: validDocument, documentB: '' }).expect(400).expect(({ body }) => {
      expect(body.error).toContain('two supported documents');
    });
    await request(app).post('/api/ask').send({ documentText: validDocument, question: '' }).expect(400).expect(({ body }) => {
      expect(body.error).toContain('concise question');
    });
  });

  it('uses successful AI responses and marks fallbackUsed false', async () => {
    const generate = vi.fn(async () => ({ ...analysisPayload, summary: 'AI summary from Gemini' }));
    const app = createServerApp(generate);

    await request(app).post('/api/analyze').send({ text: validDocument, language: 'English' }).expect(200).expect(({ body }) => {
      expect(body.summary).toBe('AI summary from Gemini');
      expect(body.fallbackUsed).toBe(false);
    });
    expect(generate).toHaveBeenCalledWith(expect.stringContaining('Analyze the legal document'));
  });

  it('falls back when AI generation fails and caches repeated requests', async () => {
    const generate = vi.fn(async () => {
      throw new Error('Gemini unavailable');
    });
    const app = createServerApp(generate);

    const first = await request(app).post('/api/ask').send({ documentText: validDocument, question: 'Can I terminate?' }).expect(200);
    const second = await request(app).post('/api/ask').send({ documentText: validDocument, question: 'Can I terminate?' }).expect(200);

    expect(first.body.fallbackUsed).toBe(true);
    expect(second.body).toEqual(first.body);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('compares and answers through AI when mock provider succeeds', async () => {
    const generate = vi.fn(async (prompt: string) => (prompt.includes('Compare Document A') ? comparisonPayload : qaPayload));
    const app = createServerApp(generate);

    await request(app).post('/api/compare').send({ documentA: validDocument, documentB: `${validDocument} Revised payment is $4,200.` }).expect(200).expect(({ body }) => {
      expect(body.whatChanged).toBe(comparisonPayload.whatChanged);
      expect(body.fallbackUsed).toBe(false);
    });
    await request(app).post('/api/ask').send({ documentText: validDocument, question: 'Can I terminate?' }).expect(200).expect(({ body }) => {
      expect(body.answer).toBe(qaPayload.answer);
      expect(body.fallbackUsed).toBe(false);
    });
  });
});
