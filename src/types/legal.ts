export type Language = 'English' | 'Hindi' | 'Hinglish';

export type ClauseCategory =
  | 'Payment'
  | 'Termination'
  | 'Renewal'
  | 'Liability'
  | 'Indemnity'
  | 'Confidentiality'
  | 'Intellectual Property'
  | 'Dispute Resolution'
  | 'Governing Law'
  | 'Data/Privacy'
  | 'Restrictions'
  | 'Deadline/Notice'
  | 'Other';

export type RiskSeverity = 'Low' | 'Medium' | 'High';

export interface ClauseInsight {
  category: ClauseCategory;
  excerpt: string;
  explanation: string;
  whyItMatters: string;
}

export interface RiskInsight {
  severity: RiskSeverity;
  title: string;
  explanation: string;
  source?: string;
}

export interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  parties: string[];
  obligations: string[];
  importantDates: string[];
  financialObligations: string[];
  terminationConditions: string[];
  renewalConditions: string[];
  restrictions: string[];
  clauses: ClauseInsight[];
  risks: RiskInsight[];
  checklist: string[];
  nextSteps: string[];
  lawyerQuestions: string[];
  factsToGather: string[];
  fallbackUsed: boolean;
  language: Language;
}

export interface ComparisonResult {
  whatChanged: string;
  addedClauses: string[];
  removedClauses: string[];
  modifiedClauses: string[];
  changedObligations: string[];
  changedFinancialTerms: string[];
  changedTerminationTerms: string[];
  changedLiability: string[];
  changedDisputeResolution: string[];
  changedDeadlines: string[];
  importantDifferences: string[];
  fallbackUsed: boolean;
}

export interface QaResult {
  answer: string;
  citations: string[];
  fallbackUsed: boolean;
}

export interface LegalDocumentInput {
  title: string;
  text: string;
}
