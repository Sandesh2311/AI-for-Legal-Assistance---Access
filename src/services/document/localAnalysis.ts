import { CLAUSE_KEYWORDS } from '../../constants/legal';
import type { AnalysisResult, ClauseInsight, Language, RiskInsight } from '../../types/legal';
import { findMatchingSentences, sentencesFrom, uniqueItems } from '../../utils/text';

const obligationKeywords = ['must', 'shall', 'will', 'required', 'responsible', 'agrees to'];
const dateKeywords = ['date', 'days', 'months', 'years', 'term', 'deadline', 'notice', 'renew'];
const riskKeywords = ['sole discretion', 'immediately', 'indirect', 'consequential', 'exclusive', 'non-compete', 'late', 'liable', 'indemnify'];

export function analyzeLocally(text: string, language: Language): AnalysisResult {
  const sentences = sentencesFrom(text);
  const clauses = extractClauses(text);
  const obligations = findMatchingSentences(text, obligationKeywords, 8);
  const importantDates = findMatchingSentences(text, dateKeywords, 8);
  const financialObligations = findMatchingSentences(text, ['$', 'payment', 'pay', 'fee', 'invoice', 'interest'], 8);
  const terminationConditions = findMatchingSentences(text, ['terminate', 'termination', 'cancel'], 6);
  const renewalConditions = findMatchingSentences(text, ['renew', 'renewal'], 5);
  const restrictions = findMatchingSentences(text, ['restrict', 'prohibit', 'exclusive', 'non-compete', 'non-solicit'], 5);
  const risks = extractRisks(text);

  return {
    summary: localize(
      `This document appears to set out legal rights and responsibilities between the parties. Key topics detected include ${clauses
        .slice(0, 5)
        .map((clause) => clause.category)
        .join(', ') || 'general obligations'}. Review the listed clauses, deadlines, payment terms, and risk notes before relying on or signing it.`,
      language,
    ),
    keyPoints: uniqueItems(sentences.slice(0, 5), 5),
    parties: extractParties(text),
    obligations,
    importantDates,
    financialObligations,
    terminationConditions,
    renewalConditions,
    restrictions,
    clauses,
    risks,
    checklist: buildChecklist(clauses, risks),
    nextSteps: buildNextSteps(clauses, risks),
    lawyerQuestions: buildLawyerQuestions(clauses, risks),
    factsToGather: [
      'Final version of the document and any amendments',
      'Timeline of notices, payments, approvals, or disputes',
      'Related invoices, emails, attachments, and prior agreements',
      'Your goals, concerns, and acceptable negotiation points',
    ],
    fallbackUsed: true,
    language,
  };
}

export function extractClauses(text: string): ClauseInsight[] {
  return Object.entries(CLAUSE_KEYWORDS)
    .filter(([category]) => category !== 'Other')
    .flatMap(([category, keywords]) =>
      findMatchingSentences(text, keywords, 2).map((excerpt) => ({
        category: category as ClauseInsight['category'],
        excerpt,
        explanation: explainClause(category, excerpt),
        whyItMatters: `${category} terms can affect cost, control, remedies, deadlines, or legal exposure.`,
      })),
    )
    .slice(0, 16);
}

export function extractRisks(text: string): RiskInsight[] {
  const matches = findMatchingSentences(text, riskKeywords, 8);
  const risks: RiskInsight[] = matches.map((source) => ({
    severity: source.toLowerCase().includes('indemnify') || source.toLowerCase().includes('immediately') ? 'High' : 'Medium',
    title: 'Potentially important or one-sided wording',
    explanation: 'This wording may warrant review by a qualified legal professional because it can affect rights, costs, or available remedies.',
    source,
  }));

  if (!findMatchingSentences(text, ['terminate', 'termination'], 1).length) {
    risks.push({
      severity: 'Medium',
      title: 'Termination details not clearly detected',
      explanation: 'The document may not clearly explain how the relationship can end. Confirm notice periods, cure rights, and consequences.',
    });
  }
  return risks.slice(0, 8);
}

export function buildChecklist(clauses: ClauseInsight[], risks: RiskInsight[]): string[] {
  const categories = new Set(clauses.map((clause) => clause.category));
  const items = [
    categories.has('Payment') && 'Verify payment amount, due date, late fees, and pause rights.',
    categories.has('Termination') && 'Confirm termination notice, cure periods, and immediate termination triggers.',
    categories.has('Renewal') && 'Check renewal term and non-renewal notice deadline.',
    categories.has('Liability') && 'Review liability caps and excluded damages.',
    categories.has('Dispute Resolution') && 'Confirm forum, arbitration, venue, and escalation steps.',
    categories.has('Intellectual Property') && 'Confirm ownership or license rights before and after payment.',
    risks.length > 0 && 'Ask a legal professional about flagged risks or ambiguous wording.',
  ].filter(Boolean) as string[];
  return items.length ? items : ['Identify missing payment, termination, dispute, and responsibility terms before signing.'];
}

export function buildNextSteps(clauses: ClauseInsight[], risks: RiskInsight[]): string[] {
  return [
    'Read the clause excerpts next to the plain-language explanations.',
    risks.length ? 'Prioritize the flagged risk items for professional review.' : 'Confirm whether any important terms are missing from the document.',
    clauses.some((clause) => clause.category === 'Payment') ? 'Check every financial amount, due date, and late-fee trigger.' : 'Ask whether payment or fee terms should be added.',
    'Prepare targeted questions before speaking with a qualified legal professional.',
  ];
}

export function buildLawyerQuestions(clauses: ClauseInsight[], risks: RiskInsight[]): string[] {
  const questions = [
    'What obligations should I understand before signing or relying on this document?',
    risks.length ? 'Which flagged terms create the most practical risk for my situation?' : 'Are any important protections missing from this document?',
    clauses.some((clause) => clause.category === 'Termination') && 'Is the termination clause reasonable for my goals?',
    clauses.some((clause) => clause.category === 'Liability') && 'How does the liability language affect my exposure?',
    clauses.some((clause) => clause.category === 'Intellectual Property') && 'Do the ownership or license terms match what I expect to receive?',
  ].filter(Boolean) as string[];
  return uniqueItems(questions, 6);
}

function extractParties(text: string): string[] {
  const partyPattern = /([A-Z][A-Za-z0-9&.,' -]{2,60})\s+\("([^"]+)"\)/g;
  const parties = [...text.matchAll(partyPattern)].map((match) => `${match[1].trim()} (${match[2]})`);
  return uniqueItems(parties, 6);
}

function explainClause(category: string, excerpt: string): string {
  if (category === 'Payment') return 'This explains money owed, timing, fees, invoices, or consequences for late payment.';
  if (category === 'Termination') return 'This explains how the agreement can end and what notice or breach events may matter.';
  if (category === 'Renewal') return 'This explains whether the relationship continues automatically or requires notice to stop.';
  if (category === 'Liability') return 'This may limit or define responsibility for losses, damages, or claims.';
  if (category === 'Confidentiality') return 'This controls how private business or technical information must be protected.';
  return `This clause appears relevant because the document says: "${excerpt.slice(0, 140)}${excerpt.length > 140 ? '...' : ''}"`;
}

function localize(text: string, language: Language): string {
  if (language === 'Hindi') {
    return `${text} हिंदी मोड: कृपया मूल कानूनी अर्थ की पुष्टि योग्य कानूनी पेशेवर से करें.`;
  }
  if (language === 'Hinglish') {
    return `${text} Hinglish note: yeh legal advice nahi hai; important points lawyer se confirm karein.`;
  }
  return text;
}
