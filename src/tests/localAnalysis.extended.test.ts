import { describe, expect, it } from 'vitest';
import type { ClauseInsight, RiskInsight } from '../types/legal';
import { buildChecklist, buildLawyerQuestions, buildNextSteps, analyzeLocally, extractClauses, extractRisks } from '../services/document/localAnalysis';
import { unicodeDocument, validDocument } from './fixtures';

describe('document analysis edge cases', () => {
  it('extracts plain-language analysis fields from a full legal document', () => {
    const analysis = analyzeLocally(validDocument, 'English');

    expect(analysis.summary).toContain('legal rights and responsibilities');
    expect(analysis.keyPoints[0]).toContain('DEMO SAMPLE DOCUMENT');
    expect(analysis.obligations.join(' ')).toMatch(/must|will/i);
    expect(analysis.importantDates.join(' ')).toContain('15 days');
    expect(analysis.financialObligations.join(' ')).toContain('$3,500');
    expect(analysis.terminationConditions.join(' ')).toContain('terminate');
    expect(analysis.renewalConditions.join(' ')).toContain('renew');
    expect(analysis.restrictions.length).toBeGreaterThanOrEqual(0);
    expect(analysis.parties).toEqual(expect.arrayContaining([expect.stringContaining('Provider'), expect.stringContaining('Client')]));
    expect(analysis.fallbackUsed).toBe(true);
  });

  it('does not fabricate unsupported parties or clauses', () => {
    const text = 'This short policy requires written notice before changes. It has no named company parties and no payment terms. '.repeat(2);
    const analysis = analyzeLocally(text, 'English');

    expect(analysis.parties).toEqual([]);
    expect(analysis.clauses.some((clause) => clause.category === 'Intellectual Property')).toBe(false);
    expect(analysis.financialObligations.join(' ')).not.toContain('$999');
  });

  it('handles ambiguous and missing termination content cautiously', () => {
    const text = 'This agreement shall continue indefinitely. The provider may act in its sole discretion. Confidential information must remain secret. '.repeat(2);
    const risks = extractRisks(text);

    expect(risks.some((risk) => risk.title === 'Termination details not clearly detected')).toBe(true);
    expect(risks.map((risk) => risk.explanation).join(' ')).toContain('may warrant review');
  });

  it('detects broad high-severity risk language', () => {
    const risks = extractRisks('The Client must indemnify Provider. Provider may terminate immediately after breach. '.repeat(2));

    expect(risks.some((risk) => risk.severity === 'High')).toBe(true);
  });

  it('covers all clause explanation branches', () => {
    const text = [
      'Client will pay invoices within 10 days.',
      'Either party may terminate after breach.',
      'The agreement will renew monthly.',
      'Provider liability is limited for damages.',
      'Confidential information must be protected.',
      'Copyright ownership remains with Provider.',
    ].join(' ');

    const clauses = extractClauses(text.repeat(2));

    expect(clauses.find((clause) => clause.category === 'Payment')?.explanation).toContain('money owed');
    expect(clauses.find((clause) => clause.category === 'Termination')?.explanation).toContain('agreement can end');
    expect(clauses.find((clause) => clause.category === 'Renewal')?.explanation).toContain('continues automatically');
    expect(clauses.find((clause) => clause.category === 'Liability')?.explanation).toContain('responsibility');
    expect(clauses.find((clause) => clause.category === 'Confidentiality')?.explanation).toContain('private');
    expect(clauses.find((clause) => clause.category === 'Intellectual Property')?.explanation).toContain('document says');
  });

  it('generates fallback checklist, next steps, and lawyer questions for sparse analysis', () => {
    const checklist = buildChecklist([], []);
    const nextSteps = buildNextSteps([], []);
    const questions = buildLawyerQuestions([], []);

    expect(checklist).toContain('Identify missing payment, termination, dispute, and responsibility terms before signing.');
    expect(nextSteps).toContain('Confirm whether any important terms are missing from the document.');
    expect(nextSteps).toContain('Ask whether payment or fee terms should be added.');
    expect(questions).toContain('Are any important protections missing from this document?');
    expect([...checklist, ...nextSteps, ...questions].join(' ')).not.toMatch(/legal advice/i);
  });

  it('generates targeted checklist and lawyer prep for multiple clause/risk categories', () => {
    const clauses: ClauseInsight[] = [
      { category: 'Payment', excerpt: 'pay', explanation: 'pay', whyItMatters: 'money' },
      { category: 'Termination', excerpt: 'terminate', explanation: 'end', whyItMatters: 'exit' },
      { category: 'Renewal', excerpt: 'renew', explanation: 'renew', whyItMatters: 'term' },
      { category: 'Liability', excerpt: 'liable', explanation: 'risk', whyItMatters: 'loss' },
      { category: 'Dispute Resolution', excerpt: 'arbitrate', explanation: 'forum', whyItMatters: 'venue' },
      { category: 'Intellectual Property', excerpt: 'copyright', explanation: 'ownership', whyItMatters: 'rights' },
    ];
    const risks: RiskInsight[] = [{ severity: 'Medium', title: 'Ambiguous', explanation: 'May warrant review.' }];

    expect(buildChecklist(clauses, risks)).toEqual(
      expect.arrayContaining([
        'Verify payment amount, due date, late fees, and pause rights.',
        'Confirm termination notice, cure periods, and immediate termination triggers.',
        'Ask a legal professional about flagged risks or ambiguous wording.',
      ]),
    );
    expect(buildLawyerQuestions(clauses, risks)).toEqual(expect.arrayContaining(['How does the liability language affect my exposure?']));
  });

  it('localizes Hindi and Hinglish assistance without changing fallback marker', () => {
    expect(analyzeLocally(unicodeDocument, 'Hindi').summary).toContain('हिंदी मोड');
    expect(analyzeLocally(unicodeDocument, 'Hinglish').summary).toContain('Hinglish note');
  });
});
