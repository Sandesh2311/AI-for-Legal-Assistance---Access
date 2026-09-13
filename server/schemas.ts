import { z } from 'zod';

export const languageSchema = z.enum(['English', 'Hindi', 'Hinglish']);
export const textSchema = z.string().trim().min(80).max(Number(process.env.MAX_DOCUMENT_CHARS || 24000));

export const analyzeRequestSchema = z.object({
  text: textSchema,
  language: languageSchema,
});

export const compareRequestSchema = z.object({
  documentA: textSchema,
  documentB: textSchema,
});

export const askRequestSchema = z.object({
  documentText: textSchema,
  question: z.string().trim().min(1).max(500),
});
