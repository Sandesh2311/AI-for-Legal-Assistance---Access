import { describe, expect, it } from 'vitest';
import { MAX_DOCUMENT_CHARS } from '../constants/legal';
import { UserFacingError, validateDocumentText, validateQuestion, validateTextFile } from '../utils/validation';

describe('validation boundaries', () => {
  it('rejects whitespace-only documents and questions', () => {
    expect(() => validateDocumentText('   \n\t  ')).toThrow('required');
    expect(() => validateQuestion('   ')).toThrow('Ask a question');
  });

  it('accepts exact minimum and maximum valid document sizes', () => {
    expect(validateDocumentText('a'.repeat(80))).toHaveLength(80);
    expect(validateDocumentText('a'.repeat(MAX_DOCUMENT_CHARS))).toHaveLength(MAX_DOCUMENT_CHARS);
  });

  it('rejects oversized document text and questions', () => {
    expect(() => validateDocumentText('a'.repeat(MAX_DOCUMENT_CHARS + 1))).toThrow('too large');
    expect(() => validateQuestion('q'.repeat(501))).toThrow('under 500 characters');
  });

  it('accepts valid text files by MIME type or extension', () => {
    expect(() => validateTextFile(new File(['valid'], 'agreement.txt', { type: 'text/plain' }))).not.toThrow();
    expect(() => validateTextFile(new File(['valid'], 'agreement.txt', { type: '' }))).not.toThrow();
  });

  it('rejects oversized valid-type files and exposes user-facing errors', () => {
    const file = new File(['a'.repeat(MAX_DOCUMENT_CHARS * 2 + 1)], 'large.txt', { type: 'text/plain' });
    expect(() => validateTextFile(file)).toThrow('too large');
    expect(new UserFacingError('Readable message')).toMatchObject({ name: 'UserFacingError', message: 'Readable message' });
  });
});
