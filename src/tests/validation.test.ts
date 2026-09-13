import { describe, expect, it } from 'vitest';
import { validateDocumentText, validateQuestion, validateTextFile } from '../utils/validation';

describe('validation', () => {
  it('rejects empty and tiny documents', () => {
    expect(() => validateDocumentText('')).toThrow('required');
    expect(() => validateDocumentText('short')).toThrow('at least 80 characters');
  });

  it('accepts meaningful document text', () => {
    const text = 'This Agreement requires payment within 15 days and may be terminated with written notice. '.repeat(2);
    expect(validateDocumentText(text)).toContain('Agreement');
  });

  it('validates questions', () => {
    expect(() => validateQuestion('')).toThrow('Ask a question');
    expect(validateQuestion('Can I terminate?')).toBe('Can I terminate?');
  });

  it('rejects unsupported files', () => {
    const file = new File(['hello'], 'contract.pdf', { type: 'application/pdf' });
    expect(() => validateTextFile(file)).toThrow('Only plain text');
  });
});
