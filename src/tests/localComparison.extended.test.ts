import { describe, expect, it } from 'vitest';
import { compareLocally } from '../services/comparison/localComparison';
import { SAMPLE_DOCUMENT_A, SAMPLE_DOCUMENT_B } from './fixtures';

describe('document comparison edge cases', () => {
  it('handles identical documents without fabricating added or removed clauses', () => {
    const result = compareLocally(SAMPLE_DOCUMENT_A, SAMPLE_DOCUMENT_A);

    expect(result.addedClauses).toEqual([]);
    expect(result.removedClauses).toEqual([]);
    expect(result.fallbackUsed).toBe(true);
  });

  it('detects added, removed, modified, payment, termination, liability, dispute, and deadline terms', () => {
    const result = compareLocally(SAMPLE_DOCUMENT_A, SAMPLE_DOCUMENT_B);
    const combined = JSON.stringify(result);

    expect(result.addedClauses.length).toBeGreaterThan(0);
    expect(result.removedClauses.length).toBeGreaterThan(0);
    expect(result.modifiedClauses.length).toBeGreaterThan(0);
    expect(result.changedObligations.join(' ')).toContain('three business days');
    expect(result.changedFinancialTerms.join(' ')).toContain('$4,200');
    expect(result.changedTerminationTerms.join(' ')).toContain('60 days');
    expect(result.changedLiability.join(' ')).toContain('one month');
    expect(result.changedDisputeResolution.join(' ')).toContain('Dallas');
    expect(result.changedDeadlines.join(' ')).toContain('60 days');
    expect(combined).toContain('Review each difference');
  });

  it('handles one empty comparison side deterministically', () => {
    expect(compareLocally('', SAMPLE_DOCUMENT_A).addedClauses.length).toBeGreaterThan(0);
    expect(compareLocally(SAMPLE_DOCUMENT_A, '').removedClauses.length).toBeGreaterThan(0);
  });
});
