import { describe, expect, it } from 'vitest';
import { SAMPLE_DOCUMENT_A } from '../constants/legal';
import { compareLocally } from '../services/comparison/localComparison';
import { answerLocally } from '../services/chat/localQa';
import { analyzeLocally, extractClauses, extractRisks } from '../services/document/localAnalysis';

describe('local legal intelligence', () => {
  it('extracts clauses without fabricating unrelated categories', () => {
    const clauses = extractClauses(SAMPLE_DOCUMENT_A);
    expect(clauses.some((clause) => clause.category === 'Payment')).toBe(true);
    expect(clauses.some((clause) => clause.category === 'Termination')).toBe(true);
  });

  it('detects risk language cautiously', () => {
    const risks = extractRisks(SAMPLE_DOCUMENT_A);
    expect(risks.length).toBeGreaterThan(0);
    expect(risks[0].explanation).toContain('may warrant review');
  });

  it('builds a complete fallback analysis', () => {
    const analysis = analyzeLocally(SAMPLE_DOCUMENT_A, 'Hinglish');
    expect(analysis.fallbackUsed).toBe(true);
    expect(analysis.summary).toContain('Hinglish');
    expect(analysis.checklist.length).toBeGreaterThan(2);
    expect(analysis.lawyerQuestions.length).toBeGreaterThan(1);
  });

  it('answers grounded questions from document text', () => {
    const answer = answerLocally(SAMPLE_DOCUMENT_A, 'How much notice is required to terminate?');
    expect(answer.answer).toContain('provided document');
    expect(answer.citations.length).toBeGreaterThan(0);
  });

  it('says when the document does not answer a question', () => {
    const answer = answerLocally(SAMPLE_DOCUMENT_A, 'Who owns the parking lot?');
    expect(answer.answer).toContain('does not clearly contain enough information');
  });

  it('compares legal documents by important term groups', () => {
    const revised = SAMPLE_DOCUMENT_A.replace('$3,500', '$5,000').replace('30 days', '60 days');
    const comparison = compareLocally(SAMPLE_DOCUMENT_A, revised);
    expect(comparison.fallbackUsed).toBe(true);
    expect(comparison.changedFinancialTerms.join(' ')).toContain('$5,000');
    expect(comparison.changedDeadlines.join(' ')).toContain('60 days');
  });
});
