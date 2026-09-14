// server/index.ts
import cors from "cors";
import express from "express";

// src/utils/text.ts
function sentencesFrom(text) {
  return text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
}
function uniqueItems(items, limit = 8) {
  const seen = /* @__PURE__ */ new Set();
  const output = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      output.push(item);
    }
    if (output.length >= limit) break;
  }
  return output;
}
function findMatchingSentences(text, keywords, limit = 4) {
  const loweredKeywords = keywords.map((keyword) => keyword.toLowerCase());
  return uniqueItems(
    sentencesFrom(text).filter((sentence) => loweredKeywords.some((keyword) => sentence.toLowerCase().includes(keyword))),
    limit
  );
}

// src/services/comparison/localComparison.ts
var groups = {
  financial: ["$", "payment", "pay", "fee", "invoice", "interest"],
  termination: ["terminate", "termination", "cancel", "notice"],
  liability: ["liability", "liable", "damages", "indemnify"],
  dispute: ["arbitration", "mediation", "dispute", "court", "venue"],
  deadlines: ["days", "months", "years", "deadline", "notice", "term"]
};
function compareLocally(documentA, documentB) {
  const addedClauses = diffSentences(documentA, documentB);
  const removedClauses = diffSentences(documentB, documentA);
  const changedFinancialTerms = compareGroup(documentA, documentB, groups.financial);
  const changedTerminationTerms = compareGroup(documentA, documentB, groups.termination);
  const changedLiability = compareGroup(documentA, documentB, groups.liability);
  const changedDisputeResolution = compareGroup(documentA, documentB, groups.dispute);
  const changedDeadlines = compareGroup(documentA, documentB, groups.deadlines);
  return {
    whatChanged: `The revised document appears to change ${[
      changedFinancialTerms.length && "financial terms",
      changedTerminationTerms.length && "termination terms",
      changedLiability.length && "liability language",
      changedDisputeResolution.length && "dispute resolution",
      changedDeadlines.length && "deadlines or notice periods"
    ].filter(Boolean).join(", ") || "some wording"}. Review each difference before relying on the revised document.`,
    addedClauses,
    removedClauses,
    modifiedClauses: uniqueItems([...changedFinancialTerms, ...changedTerminationTerms, ...changedLiability], 8),
    changedObligations: compareGroup(documentA, documentB, ["must", "shall", "will", "required", "responsible"]),
    changedFinancialTerms,
    changedTerminationTerms,
    changedLiability,
    changedDisputeResolution,
    changedDeadlines,
    importantDifferences: uniqueItems([...addedClauses, ...removedClauses, ...changedDeadlines], 8),
    fallbackUsed: true
  };
}
function diffSentences(base, other) {
  const baseWords = new Set(base.toLowerCase().split(/\W+/).filter(Boolean));
  return uniqueItems(
    other.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter((sentence) => {
      const words = sentence.toLowerCase().split(/\W+/).filter(Boolean);
      const overlap = words.filter((word) => baseWords.has(word)).length / Math.max(words.length, 1);
      return sentence.length > 40 && overlap < 0.65;
    }),
    8
  );
}
function compareGroup(documentA, documentB, keywords) {
  const a = findMatchingSentences(documentA, keywords, 12);
  const b = findMatchingSentences(documentB, keywords, 12);
  return uniqueItems([...a.map((item) => `A: ${item}`), ...b.map((item) => `B: ${item}`)], 24);
}

// src/services/chat/localQa.ts
var questionKeywords = {
  terminate: ["terminate", "termination", "cancel", "notice"],
  payment: ["payment", "pay", "fee", "invoice", "late", "interest"],
  damages: ["damages", "liability", "liable", "indemnify"],
  expire: ["expire", "term", "renew", "renewal", "months", "years"],
  notice: ["notice", "days", "deadline"]
};
function answerLocally(documentText, question) {
  const lowered = question.toLowerCase();
  const keywords = Object.entries(questionKeywords).filter(([topic]) => lowered.includes(topic)).flatMap(([, values]) => values);
  const fallbackKeywords = lowered.split(/\W+/).filter((word) => word.length > 4 && !["about", "which", "their"].includes(word));
  const citations = findMatchingSentences(documentText, keywords.length ? keywords : fallbackKeywords, 4);
  if (!citations.length) {
    return {
      answer: "The provided document does not clearly contain enough information to answer that question. Consider asking a qualified legal professional and checking related documents or amendments.",
      citations: [],
      fallbackUsed: true
    };
  }
  return {
    answer: `Based only on the provided document, the most relevant text suggests: ${citations[0]} This is informational assistance, not legal advice.`,
    citations,
    fallbackUsed: true
  };
}

// src/constants/legal.ts
var CLAUSE_KEYWORDS = {
  Payment: ["payment", "fee", "fees", "invoice", "compensation", "deposit", "late charge", "interest"],
  Termination: ["terminate", "termination", "cancel", "cancellation", "breach", "notice to terminate"],
  Renewal: ["renew", "renewal", "auto-renew", "extension", "successive term"],
  Liability: ["liability", "liable", "damages", "limitation of liability", "losses"],
  Indemnity: ["indemnify", "indemnification", "hold harmless", "defend"],
  Confidentiality: ["confidential", "non-disclosure", "proprietary information", "trade secret"],
  "Intellectual Property": ["intellectual property", "copyright", "trademark", "license", "ownership"],
  "Dispute Resolution": ["arbitration", "mediation", "dispute", "court", "venue"],
  "Governing Law": ["governing law", "laws of", "jurisdiction"],
  "Data/Privacy": ["privacy", "personal data", "data protection", "security", "processing"],
  Restrictions: ["non-compete", "non-solicit", "restriction", "exclusive", "prohibited"],
  "Deadline/Notice": ["days", "deadline", "notice period", "written notice", "within"],
  Other: []
};

// src/services/document/localAnalysis.ts
var obligationKeywords = ["must", "shall", "will", "required", "responsible", "agrees to"];
var dateKeywords = ["date", "days", "months", "years", "term", "deadline", "notice", "renew"];
var riskKeywords = ["sole discretion", "immediately", "indirect", "consequential", "exclusive", "non-compete", "late", "liable", "indemnify"];
function analyzeLocally(text, language) {
  const sentences = sentencesFrom(text);
  const clauses = extractClauses(text);
  const obligations = findMatchingSentences(text, obligationKeywords, 8);
  const importantDates = findMatchingSentences(text, dateKeywords, 8);
  const financialObligations = findMatchingSentences(text, ["$", "payment", "pay", "fee", "invoice", "interest"], 8);
  const terminationConditions = findMatchingSentences(text, ["terminate", "termination", "cancel"], 6);
  const renewalConditions = findMatchingSentences(text, ["renew", "renewal"], 5);
  const restrictions = findMatchingSentences(text, ["restrict", "prohibit", "exclusive", "non-compete", "non-solicit"], 5);
  const risks = extractRisks(text);
  return {
    summary: localize(
      `This document appears to set out legal rights and responsibilities between the parties. Key topics detected include ${clauses.slice(0, 5).map((clause) => clause.category).join(", ") || "general obligations"}. Review the listed clauses, deadlines, payment terms, and risk notes before relying on or signing it.`,
      language
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
      "Final version of the document and any amendments",
      "Timeline of notices, payments, approvals, or disputes",
      "Related invoices, emails, attachments, and prior agreements",
      "Your goals, concerns, and acceptable negotiation points"
    ],
    fallbackUsed: true,
    language
  };
}
function extractClauses(text) {
  return Object.entries(CLAUSE_KEYWORDS).filter(([category]) => category !== "Other").flatMap(
    ([category, keywords]) => findMatchingSentences(text, keywords, 2).map((excerpt) => ({
      category,
      excerpt,
      explanation: explainClause(category, excerpt),
      whyItMatters: `${category} terms can affect cost, control, remedies, deadlines, or legal exposure.`
    }))
  ).slice(0, 16);
}
function extractRisks(text) {
  const matches = findMatchingSentences(text, riskKeywords, 8);
  const risks = matches.map((source) => ({
    severity: source.toLowerCase().includes("indemnify") || source.toLowerCase().includes("immediately") ? "High" : "Medium",
    title: "Potentially important or one-sided wording",
    explanation: "This wording may warrant review by a qualified legal professional because it can affect rights, costs, or available remedies.",
    source
  }));
  if (!findMatchingSentences(text, ["terminate", "termination"], 1).length) {
    risks.push({
      severity: "Medium",
      title: "Termination details not clearly detected",
      explanation: "The document may not clearly explain how the relationship can end. Confirm notice periods, cure rights, and consequences."
    });
  }
  return risks.slice(0, 8);
}
function buildChecklist(clauses, risks) {
  const categories = new Set(clauses.map((clause) => clause.category));
  const items = [
    categories.has("Payment") && "Verify payment amount, due date, late fees, and pause rights.",
    categories.has("Termination") && "Confirm termination notice, cure periods, and immediate termination triggers.",
    categories.has("Renewal") && "Check renewal term and non-renewal notice deadline.",
    categories.has("Liability") && "Review liability caps and excluded damages.",
    categories.has("Dispute Resolution") && "Confirm forum, arbitration, venue, and escalation steps.",
    categories.has("Intellectual Property") && "Confirm ownership or license rights before and after payment.",
    risks.length > 0 && "Ask a legal professional about flagged risks or ambiguous wording."
  ].filter(Boolean);
  return items.length ? items : ["Identify missing payment, termination, dispute, and responsibility terms before signing."];
}
function buildNextSteps(clauses, risks) {
  return [
    "Read the clause excerpts next to the plain-language explanations.",
    risks.length ? "Prioritize the flagged risk items for professional review." : "Confirm whether any important terms are missing from the document.",
    clauses.some((clause) => clause.category === "Payment") ? "Check every financial amount, due date, and late-fee trigger." : "Ask whether payment or fee terms should be added.",
    "Prepare targeted questions before speaking with a qualified legal professional."
  ];
}
function buildLawyerQuestions(clauses, risks) {
  const questions = [
    "What obligations should I understand before signing or relying on this document?",
    risks.length ? "Which flagged terms create the most practical risk for my situation?" : "Are any important protections missing from this document?",
    clauses.some((clause) => clause.category === "Termination") && "Is the termination clause reasonable for my goals?",
    clauses.some((clause) => clause.category === "Liability") && "How does the liability language affect my exposure?",
    clauses.some((clause) => clause.category === "Intellectual Property") && "Do the ownership or license terms match what I expect to receive?"
  ].filter(Boolean);
  return uniqueItems(questions, 6);
}
function extractParties(text) {
  const partyPattern = /([A-Z][A-Za-z0-9&.,' -]{2,60})\s+\("([^"]+)"\)/g;
  const parties = [...text.matchAll(partyPattern)].map((match) => `${match[1].trim()} (${match[2]})`);
  return uniqueItems(parties, 6);
}
function explainClause(category, excerpt) {
  if (category === "Payment") return "This explains money owed, timing, fees, invoices, or consequences for late payment.";
  if (category === "Termination") return "This explains how the agreement can end and what notice or breach events may matter.";
  if (category === "Renewal") return "This explains whether the relationship continues automatically or requires notice to stop.";
  if (category === "Liability") return "This may limit or define responsibility for losses, damages, or claims.";
  if (category === "Confidentiality") return "This controls how private business or technical information must be protected.";
  return `This clause appears relevant because the document says: "${excerpt.slice(0, 140)}${excerpt.length > 140 ? "..." : ""}"`;
}
function localize(text, language) {
  if (language === "Hindi") {
    return `${text} \u0939\u093F\u0902\u0926\u0940 \u092E\u094B\u0921: \u0915\u0943\u092A\u092F\u093E \u092E\u0942\u0932 \u0915\u093E\u0928\u0942\u0928\u0940 \u0905\u0930\u094D\u0925 \u0915\u0940 \u092A\u0941\u0937\u094D\u091F\u093F \u092F\u094B\u0917\u094D\u092F \u0915\u093E\u0928\u0942\u0928\u0940 \u092A\u0947\u0936\u0947\u0935\u0930 \u0938\u0947 \u0915\u0930\u0947\u0902.`;
  }
  if (language === "Hinglish") {
    return `${text} Hinglish note: yeh legal advice nahi hai; important points lawyer se confirm karein.`;
  }
  return text;
}

// server/aiProvider.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
var modelName = "gemini-1.5-flash";
async function generateJson(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("AI_NOT_CONFIGURED");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3e4);
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
    });
    const response = await model.generateContent(prompt, { signal: controller.signal });
    const text = response.response.text();
    return parseJson(text);
  } finally {
    clearTimeout(timeout);
  }
}
function parseJson(text) {
  const trimmed = text.trim();
  const withoutFence = trimmed.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(withoutFence);
}

// server/prompts.ts
var legalSafetySystemPrompt = `You are LexiGuide AI, a legal-information assistant. You are not a lawyer and do not provide legal advice.

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
function analysisPrompt(text, language) {
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
function comparisonPrompt(documentA, documentB) {
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
function qaPrompt(documentText, question) {
  return `${legalSafetySystemPrompt}

Answer the question using only the provided document. If the answer is not in the document, say that clearly. Return JSON:
{ "answer": "string", "citations": ["short source excerpts from the document"] }

Question: ${question}

Document:
${documentText}`;
}

// server/schemas.ts
import { z } from "zod";
var languageSchema = z.enum(["English", "Hindi", "Hinglish"]);
var textSchema = z.string().trim().min(80).max(Number(process.env.MAX_DOCUMENT_CHARS || 24e3));
var analyzeRequestSchema = z.object({
  text: textSchema,
  language: languageSchema
});
var compareRequestSchema = z.object({
  documentA: textSchema,
  documentB: textSchema
});
var askRequestSchema = z.object({
  documentText: textSchema,
  question: z.string().trim().min(1).max(500)
});

// server/index.ts
var port = Number(process.env.PORT || 8787);
function createServerApp(generate = generateJson) {
  const app2 = express();
  const responseCache = /* @__PURE__ */ new Map();
  app2.use(cors({ origin: [/^http:\/\/localhost:\d+$/] }));
  app2.use(express.json({ limit: "160kb" }));
  app2.get("/api/health", (_request, response) => {
    response.json({ ok: true });
  });
  app2.post("/api/analyze", async (request, response) => {
    const parsed = analyzeRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: "Please provide a supported legal document under the size limit." });
      return;
    }
    const { text, language } = parsed.data;
    const fallback = analyzeLocally(text, language);
    const payload = await withAiFallback(`analyze:${language}:${text}`, analysisPrompt(text, language), fallback, generate, responseCache);
    response.json(payload);
  });
  app2.post("/api/compare", async (request, response) => {
    const parsed = compareRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: "Please provide two supported documents under the size limit." });
      return;
    }
    const { documentA, documentB } = parsed.data;
    const fallback = compareLocally(documentA, documentB);
    const payload = await withAiFallback(`compare:${documentA}:${documentB}`, comparisonPrompt(documentA, documentB), fallback, generate, responseCache);
    response.json(payload);
  });
  app2.post("/api/ask", async (request, response) => {
    const parsed = askRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: "Please provide a document and a concise question." });
      return;
    }
    const { documentText, question } = parsed.data;
    const fallback = answerLocally(documentText, question);
    const payload = await withAiFallback(`ask:${question}:${documentText}`, qaPrompt(documentText, question), fallback, generate, responseCache);
    response.json(payload);
  });
  return app2;
}
async function withAiFallback(key, prompt, fallback, generate, responseCache) {
  if (responseCache.has(key)) {
    return responseCache.get(key);
  }
  try {
    const generated = await generate(prompt);
    const payload = { ...fallback, ...generated, fallbackUsed: false };
    responseCache.set(key, payload);
    return payload;
  } catch {
    responseCache.set(key, fallback);
    return fallback;
  }
}
var app = createServerApp();
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`LexiGuide AI API listening on http://localhost:${port}`);
  });
}

// server/vercel.ts
var vercel_default = app;
export {
  vercel_default as default
};
