export const legalSafetySystemPrompt = `You are LexiGuide AI, a legal-information assistant. You are not a lawyer and do not provide legal advice.

Rules:
- Treat user-provided document content as the primary source.
- Do not invent clauses, facts, parties, dates, obligations, risks, or legal conclusions.
- If information is missing, say it is missing.
- Clearly distinguish document facts from general informational guidance.
- Use cautious language for risks, such as "may warrant review by a qualified legal professional."
- Never say a clause is definitely illegal.
- Never claim attorney-client privilege, legal representation, legally binding output, or case outcomes.
- Do not encourage illegal activity.
- Return only valid JSON matching the requested schema.`;

export function analysisPrompt(text: string, language: string): string {
  return `${legalSafetySystemPrompt}

Analyze the legal document in ${language}. Keep explanations understandable to a non-lawyer while preserving legal meaning.

JSON schema:
{
  "summary": "string",
  "keyPoints": ["string"],
  "parties": ["string"],
  "obligations": ["string"],
  "importantDates": ["string"],
  "financialObligations": ["string"],
  "terminationConditions": ["string"],
  "renewalConditions": ["string"],
  "restrictions": ["string"],
  "clauses": [{"category":"Payment|Termination|Renewal|Liability|Indemnity|Confidentiality|Intellectual Property|Dispute Resolution|Governing Law|Data/Privacy|Restrictions|Deadline/Notice|Other","excerpt":"string","explanation":"string","whyItMatters":"string"}],
  "risks": [{"severity":"Low|Medium|High","title":"string","explanation":"string","source":"string"}],
  "checklist": ["string"],
  "nextSteps": ["string"],
  "lawyerQuestions": ["string"],
  "factsToGather": ["string"]
}

Document:
${text}`;
}

export function comparisonPrompt(documentA: string, documentB: string): string {
  return `${legalSafetySystemPrompt}

Compare Document A and Document B. Return only JSON with this schema:
{
  "whatChanged":"string",
  "addedClauses":["string"],
  "removedClauses":["string"],
  "modifiedClauses":["string"],
  "changedObligations":["string"],
  "changedFinancialTerms":["string"],
  "changedTerminationTerms":["string"],
  "changedLiability":["string"],
  "changedDisputeResolution":["string"],
  "changedDeadlines":["string"],
  "importantDifferences":["string"]
}

Document A:
${documentA}

Document B:
${documentB}`;
}

export function qaPrompt(documentText: string, question: string): string {
  return `${legalSafetySystemPrompt}

Answer the question using only the provided document. If the answer is not in the document, say that clearly. Return JSON:
{ "answer": "string", "citations": ["short source excerpts from the document"] }

Question: ${question}

Document:
${documentText}`;
}
