import { describe, expect, it } from 'vitest';
import { findMatchingSentences, sentencesFrom, uniqueItems } from '../utils/text';

describe('text utilities', () => {
  it('normalizes whitespace and splits sentences', () => {
    expect(sentencesFrom(' First sentence.   Second sentence!  Third? ')).toEqual(['First sentence.', 'Second sentence!', 'Third?']);
  });

  it('deduplicates items case-insensitively with a limit', () => {
    expect(uniqueItems(['Pay', 'pay', 'Terminate', 'Renew'], 2)).toEqual(['Pay', 'Terminate']);
  });

  it('finds matching sentences by keyword and returns unique matches', () => {
    const matches = findMatchingSentences('Client must pay. Client must pay. Either party may terminate.', ['pay', 'terminate'], 5);
    expect(matches).toEqual(['Client must pay.', 'Either party may terminate.']);
  });
});
