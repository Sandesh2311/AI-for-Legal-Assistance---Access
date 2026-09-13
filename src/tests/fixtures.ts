import { SAMPLE_DOCUMENT_A, SAMPLE_DOCUMENT_B } from '../constants/legal';
import type { AnalysisResult, ComparisonResult, QaResult } from '../types/legal';

export const validDocument = `${SAMPLE_DOCUMENT_A}

Additional note: The Client shall maintain insurance and must notify Provider within 7 days of any claim.`;

export const unicodeDocument = `सेवा समझौता ("Agreement") Party Alpha ("Alpha") और Party Beta ("Beta") के बीच है.
Alpha shall pay Beta INR 10,000 within 10 days after invoice.
Either party may terminate with 15 days written notice.
Confidential information must be protected for two years.
The agreement renews monthly unless written notice is provided.`;

export const analysisPayload: AnalysisResult = {
  summary: 'Plain summary',
  keyPoints: ['Key point'],
  parties: ['Provider', 'Client'],
  obligations: ['Client must pay'],
  importantDates: ['30 days notice'],
  financialObligations: ['$3,500 monthly'],
  terminationConditions: ['Terminate with notice'],
  renewalConditions: ['Auto renewal'],
  restrictions: ['No restrictions detected'],
  clauses: [{ category: 'Payment', excerpt: 'Client will pay.', explanation: 'Payment term.', whyItMatters: 'Money matters.' }],
  risks: [{ severity: 'Medium', title: 'Broad wording', explanation: 'May warrant review.', source: 'Provider may pause work.' }],
  checklist: ['Verify payment terms'],
  nextSteps: ['Prepare questions'],
  lawyerQuestions: ['Is the termination clause reasonable?'],
  factsToGather: ['Invoices'],
  fallbackUsed: true,
  language: 'English',
};

export const comparisonPayload: ComparisonResult = {
  whatChanged: 'Payment changed.',
  addedClauses: ['B adds indemnity.'],
  removedClauses: ['A had manager escalation.'],
  modifiedClauses: ['Payment increased.'],
  changedObligations: ['B: Client must approve faster.'],
  changedFinancialTerms: ['$4,200'],
  changedTerminationTerms: ['60 days'],
  changedLiability: ['One month cap'],
  changedDisputeResolution: ['Dallas arbitration'],
  changedDeadlines: ['60 days non-renewal'],
  importantDifferences: ['Payment and deadline changed.'],
  fallbackUsed: true,
};

export const qaPayload: QaResult = {
  answer: 'Use 30 days notice.',
  citations: ['Either party may terminate with 30 days notice.'],
  fallbackUsed: true,
};

export { SAMPLE_DOCUMENT_A, SAMPLE_DOCUMENT_B };
