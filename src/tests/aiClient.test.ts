import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeDocument, askDocumentQuestion, compareDocuments } from '../services/ai/client';
import { analysisPayload, comparisonPayload, qaPayload, validDocument } from './fixtures';

describe('client AI service abstraction', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('posts analysis, comparison, and question payloads to API endpoints', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify(analysisPayload)))
      .mockResolvedValueOnce(new Response(JSON.stringify(comparisonPayload)))
      .mockResolvedValueOnce(new Response(JSON.stringify(qaPayload)));

    await expect(analyzeDocument(validDocument, 'English')).resolves.toEqual(analysisPayload);
    await expect(compareDocuments(validDocument, `${validDocument} revised`)).resolves.toEqual(comparisonPayload);
    await expect(askDocumentQuestion(validDocument, 'Can I terminate?')).resolves.toEqual(qaPayload);

    expect(fetchMock).toHaveBeenNthCalledWith(1, expect.stringContaining('/api/analyze'), expect.objectContaining({ method: 'POST' }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringContaining('/api/compare'), expect.objectContaining({ method: 'POST' }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, expect.stringContaining('/api/ask'), expect.objectContaining({ method: 'POST' }));
  });

  it('surfaces server errors without exposing internals', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Please provide a supported legal document under the size limit.' }), { status: 400 }));

    await expect(analyzeDocument('bad', 'English')).rejects.toThrow('Please provide a supported legal document under the size limit.');
  });

  it('uses a generic message for non-ok responses without an error body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 503 }));

    await expect(analyzeDocument(validDocument, 'English')).rejects.toThrow('The AI service is unavailable. Please retry.');
  });

  it('propagates network failures', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network failure'));

    await expect(askDocumentQuestion(validDocument, 'Can I terminate?')).rejects.toThrow('network failure');
  });

  it('turns aborts into timeout guidance', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementationOnce((_url, init) => {
      const signal = (init as RequestInit).signal as AbortSignal;
      return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    });

    const request = expect(analyzeDocument(validDocument, 'English')).rejects.toThrow('The AI request timed out. Please retry with a shorter document.');
    await vi.advanceTimersByTimeAsync(30000);

    await request;
  });
});
