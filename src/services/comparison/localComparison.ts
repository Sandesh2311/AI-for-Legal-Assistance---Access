import type { ComparisonResult } from '../../types/legal';
import { findMatchingSentences, uniqueItems } from '../../utils/text';

const groups = {
  financial: ['$', 'payment', 'pay', 'fee', 'invoice', 'interest'],
  termination: ['terminate', 'termination', 'cancel', 'notice'],
  liability: ['liability', 'liable', 'damages', 'indemnify'],
  dispute: ['arbitration', 'mediation', 'dispute', 'court', 'venue'],
  deadlines: ['days', 'months', 'years', 'deadline', 'notice', 'term'],
};

export function compareLocally(documentA: string, documentB: string): ComparisonResult {
  const addedClauses = diffSentences(documentA, documentB);
  const removedClauses = diffSentences(documentB, documentA);
  const changedFinancialTerms = compareGroup(documentA, documentB, groups.financial);
  const changedTerminationTerms = compareGroup(documentA, documentB, groups.termination);
  const changedLiability = compareGroup(documentA, documentB, groups.liability);
  const changedDisputeResolution = compareGroup(documentA, documentB, groups.dispute);
  const changedDeadlines = compareGroup(documentA, documentB, groups.deadlines);

  return {
    whatChanged: `The revised document appears to change ${[
      changedFinancialTerms.length && 'financial terms',
      changedTerminationTerms.length && 'termination terms',
      changedLiability.length && 'liability language',
      changedDisputeResolution.length && 'dispute resolution',
      changedDeadlines.length && 'deadlines or notice periods',
    ]
      .filter(Boolean)
      .join(', ') || 'some wording'}. Review each difference before relying on the revised document.`,
    addedClauses,
    removedClauses,
    modifiedClauses: uniqueItems([...changedFinancialTerms, ...changedTerminationTerms, ...changedLiability], 8),
    changedObligations: compareGroup(documentA, documentB, ['must', 'shall', 'will', 'required', 'responsible']),
    changedFinancialTerms,
    changedTerminationTerms,
    changedLiability,
    changedDisputeResolution,
    changedDeadlines,
    importantDifferences: uniqueItems([...addedClauses, ...removedClauses, ...changedDeadlines], 8),
    fallbackUsed: true,
  };
}

function diffSentences(base: string, other: string): string[] {
  const baseWords = new Set(base.toLowerCase().split(/\W+/).filter(Boolean));
  return uniqueItems(
    other
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => {
        const words = sentence.toLowerCase().split(/\W+/).filter(Boolean);
        const overlap = words.filter((word) => baseWords.has(word)).length / Math.max(words.length, 1);
        return sentence.length > 40 && overlap < 0.65;
      }),
    8,
  );
}

function compareGroup(documentA: string, documentB: string, keywords: string[]): string[] {
  const a = findMatchingSentences(documentA, keywords, 12);
  const b = findMatchingSentences(documentB, keywords, 12);
  return uniqueItems([...a.map((item) => `A: ${item}`), ...b.map((item) => `B: ${item}`)], 24);
}
