import { describe, expect, it } from 'vitest';
import { answerLocally } from '../services/chat/localQa';
import { SAMPLE_DOCUMENT_A } from './fixtures';

describe('local document Q&A', () => {
  it.each([
    ['payment', 'What happens if I miss a payment?', 'Late payments may incur interest'],
    ['damages', 'Who is responsible for damages?', 'liability is limited'],
    ['expire', 'When does this agreement expire or renew?', 'initial term'],
    ['notice', 'How much notice is required?', 'written notice'],
  ])('answers %s questions with relevant document context', (_topic, question, expectedCitation) => {
    const result = answerLocally(SAMPLE_DOCUMENT_A, question);

    expect(result.fallbackUsed).toBe(true);
    expect(result.citations.join(' ')).toContain(expectedCitation);
    expect(result.answer).toContain('Based only on the provided document');
  });

  it('handles special characters and repeated irrelevant questions without inventing facts', () => {
    const result = answerLocally(SAMPLE_DOCUMENT_A, '??? parking lot parking lot 🚫');

    expect(result.citations).toEqual([]);
    expect(result.answer).toContain('does not clearly contain enough information');
  });
});
