import { describe, expect, it } from 'vitest';
import { analysisPrompt, comparisonPrompt, legalSafetySystemPrompt, qaPrompt } from '../../server/prompts';
import { analyzeRequestSchema, askRequestSchema, compareRequestSchema, languageSchema, textSchema } from '../../server/schemas';
import { validDocument } from './fixtures';

describe('prompts and request schemas', () => {
  it('prompts enforce legal safety and structured JSON', () => {
    expect(legalSafetySystemPrompt).toContain('not a lawyer');
    expect(legalSafetySystemPrompt).toContain('Do not invent clauses');
    expect(analysisPrompt(validDocument, 'Hindi')).toContain('Return only valid JSON');
    expect(comparisonPrompt(validDocument, validDocument)).toContain('Compare Document A and Document B');
    expect(qaPrompt(validDocument, 'Can I terminate?')).toContain('If the answer is not in the document');
  });

  it('validates request schemas and boundary lengths', () => {
    expect(languageSchema.safeParse('Hinglish').success).toBe(true);
    expect(languageSchema.safeParse('Spanish').success).toBe(false);
    expect(textSchema.safeParse('a'.repeat(80)).success).toBe(true);
    expect(textSchema.safeParse('a'.repeat(79)).success).toBe(false);
    expect(textSchema.safeParse('a'.repeat(24001)).success).toBe(false);
    expect(analyzeRequestSchema.safeParse({ text: validDocument, language: 'English' }).success).toBe(true);
    expect(compareRequestSchema.safeParse({ documentA: validDocument, documentB: validDocument }).success).toBe(true);
    expect(askRequestSchema.safeParse({ documentText: validDocument, question: 'Q'.repeat(500) }).success).toBe(true);
    expect(askRequestSchema.safeParse({ documentText: validDocument, question: 'Q'.repeat(501) }).success).toBe(false);
  });
});
