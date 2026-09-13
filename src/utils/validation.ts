import { ACCEPTED_FILE_TYPES, MAX_DOCUMENT_CHARS } from '../constants/legal';

export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserFacingError';
  }
}

export function validateDocumentText(text: string, fieldName = 'Document'): string {
  const normalized = text.trim();
  if (!normalized) {
    throw new UserFacingError(`${fieldName} is required.`);
  }
  if (normalized.length < 80) {
    throw new UserFacingError(`${fieldName} needs at least 80 characters for a useful review.`);
  }
  if (normalized.length > MAX_DOCUMENT_CHARS) {
    throw new UserFacingError(`${fieldName} is too large. Please keep it under ${MAX_DOCUMENT_CHARS.toLocaleString()} characters.`);
  }
  return normalized;
}

export function validateQuestion(question: string): string {
  const normalized = question.trim();
  if (!normalized) {
    throw new UserFacingError('Ask a question about the document first.');
  }
  if (normalized.length > 500) {
    throw new UserFacingError('Please keep questions under 500 characters.');
  }
  return normalized;
}

export function validateTextFile(file: File): void {
  const allowedType = ACCEPTED_FILE_TYPES.includes(file.type) || file.name.toLowerCase().endsWith('.txt');
  if (!allowedType) {
    throw new UserFacingError('Only plain text .txt files are supported in this demo.');
  }
  if (file.size > MAX_DOCUMENT_CHARS * 2) {
    throw new UserFacingError('The selected file is too large for this demo workflow.');
  }
}
