import type { QaResult } from '../../types/legal';
import { findMatchingSentences } from '../../utils/text';

const questionKeywords: Record<string, string[]> = {
  terminate: ['terminate', 'termination', 'cancel', 'notice'],
  payment: ['payment', 'pay', 'fee', 'invoice', 'late', 'interest'],
  damages: ['damages', 'liability', 'liable', 'indemnify'],
  expire: ['expire', 'term', 'renew', 'renewal', 'months', 'years'],
  notice: ['notice', 'days', 'deadline'],
};

export function answerLocally(documentText: string, question: string): QaResult {
  const lowered = question.toLowerCase();
  const keywords = Object.entries(questionKeywords)
    .filter(([topic]) => lowered.includes(topic))
    .flatMap(([, values]) => values);
  const fallbackKeywords = lowered
    .split(/\W+/)
    .filter((word) => word.length > 4 && !['about', 'which', 'their'].includes(word));
  const citations = findMatchingSentences(documentText, keywords.length ? keywords : fallbackKeywords, 4);

  if (!citations.length) {
    return {
      answer: 'The provided document does not clearly contain enough information to answer that question. Consider asking a qualified legal professional and checking related documents or amendments.',
      citations: [],
      fallbackUsed: true,
    };
  }

  return {
    answer: `Based only on the provided document, the most relevant text suggests: ${citations[0]} This is informational assistance, not legal advice.`,
    citations,
    fallbackUsed: true,
  };
}
