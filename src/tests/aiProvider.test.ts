import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generateContent: vi.fn(),
  getGenerativeModel: vi.fn(),
  constructorCall: vi.fn(),
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    constructor(apiKey: string) {
      mocks.constructorCall(apiKey);
    }

    getGenerativeModel(...args: unknown[]) {
      return mocks.getGenerativeModel(...args);
    }
  },
}));

describe('Gemini provider', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useRealTimers();
    delete process.env.GEMINI_API_KEY;
    mocks.generateContent.mockReset();
    mocks.getGenerativeModel.mockReset();
    mocks.constructorCall.mockReset();
    mocks.getGenerativeModel.mockReturnValue({ generateContent: mocks.generateContent });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.GEMINI_API_KEY;
  });

  it('rejects missing API keys before creating a Gemini client', async () => {
    const { generateJson } = await import('../../server/aiProvider');

    await expect(generateJson('prompt')).rejects.toThrow('AI_NOT_CONFIGURED');
    expect(mocks.constructorCall).not.toHaveBeenCalled();
  });

  it('parses successful JSON responses from Gemini', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    mocks.generateContent.mockResolvedValueOnce({ response: { text: () => '{"summary":"ok"}' } });
    const { generateJson } = await import('../../server/aiProvider');

    await expect(generateJson('prompt')).resolves.toEqual({ summary: 'ok' });
    expect(mocks.constructorCall).toHaveBeenCalledWith('test-key');
    expect(mocks.getGenerativeModel).toHaveBeenCalledWith(expect.objectContaining({ model: 'gemini-1.5-flash' }));
  });

  it('parses fenced JSON and propagates malformed or empty responses', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const { generateJson } = await import('../../server/aiProvider');

    mocks.generateContent.mockResolvedValueOnce({ response: { text: () => '```json\n{"answer":"ok"}\n```' } });
    await expect(generateJson('prompt')).resolves.toEqual({ answer: 'ok' });

    mocks.generateContent.mockResolvedValueOnce({ response: { text: () => 'not-json' } });
    await expect(generateJson('prompt')).rejects.toThrow();

    mocks.generateContent.mockResolvedValueOnce({ response: { text: () => '' } });
    await expect(generateJson('prompt')).rejects.toThrow();
  });

  it('propagates Gemini API failures', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    mocks.generateContent.mockRejectedValueOnce(new Error('provider down'));
    const { generateJson } = await import('../../server/aiProvider');

    await expect(generateJson('prompt')).rejects.toThrow('provider down');
  });
});
