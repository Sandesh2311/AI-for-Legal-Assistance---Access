# LexiGuide AI

Understand your documents. Know your options. Prepare with confidence.

LexiGuide AI is a GenAI legal-information platform for simplifying legal documents, highlighting important clauses, comparing versions, asking grounded questions, and preparing for a conversation with a qualified legal professional.

## Problem

Legal documents are often difficult to understand without professional help. People need a safer way to identify important terms, obligations, deadlines, risks, and questions to ask before they sign or rely on legal documents.

## Solution

LexiGuide AI provides a structured workflow:

1. Upload or paste a legal document.
2. Generate a plain-language summary.
3. Review important clauses, obligations, dates, money terms, and restrictions.
4. Flag possible risks or ambiguous wording.
5. Ask questions grounded in the document.
6. Compare two document versions.
7. Generate a checklist and legal-professional preparation notes.

## Key Features

- Document Simplifier: summary, key points, parties, obligations, dates, financial terms, termination, renewal, restrictions, and clauses.
- Clause Intelligence: categorized clause excerpts with plain-language explanations and why each clause matters.
- Risk & Consistency Review: cautious review of ambiguous or potentially concerning terms.
- Document Q&A: answers questions using only the provided document and says when the answer is missing.
- Document Compare: compares two versions across added, removed, modified, payment, termination, liability, dispute, and deadline terms.
- Action Checklist: practical before-signing checklist derived from the document.
- Professional Prep: lawyer questions, facts to gather, and documents to bring.
- Multi-language Assistance: English, Hindi, and Hinglish output modes.
- Demo Mode: clearly labelled sample documents for instant judging.

## Screenshots

Add screenshots after running the app locally:

- Home and document workspace
- Analysis results
- Document comparison
- Q&A and checklist

## Architecture

```text
src/
  constants/        Shared legal categories, limits, samples, disclaimers
  services/
    ai/            Client API abstraction
    chat/          Local grounded Q&A fallback
    comparison/    Local comparison fallback
    document/      Local document analysis and extraction
  tests/           Vitest and React Testing Library tests
  types/           Domain types
  utils/           Validation and text helpers
server/
  aiProvider.ts    Server-side Gemini integration
  index.ts         Express API boundary
  prompts.ts       Structured safety prompts
  schemas.ts       Request validation
```

## Tech Stack

- React + TypeScript
- Vite
- Express
- Google Gemini via `@google/generative-ai`
- Zod validation
- Vitest + React Testing Library
- ESLint

## GenAI Integration

The browser never receives the Gemini API key. Client code calls `/api/analyze`, `/api/compare`, and `/api/ask`. The Express server validates input, builds structured legal-safety prompts, calls Gemini from the server, parses JSON responses, and falls back to deterministic local analysis if AI is unavailable.

Repeated identical requests are cached in-memory during the server process to avoid unnecessary AI calls.

## AI Safety Approach

The AI prompt requires the model to:

- Treat user documents as the primary source.
- Avoid inventing facts, clauses, parties, or dates.
- Say when information is missing.
- Use cautious risk language.
- Avoid definitive claims that a clause is illegal.
- Avoid presenting itself as a lawyer.
- Avoid claiming attorney-client privilege or legally binding output.

The UI always shows a legal disclaimer.

## Security Approach

- API keys are read only from server-side environment variables.
- `.env`, `.env.local`, and `.env.*.local` are ignored.
- `.env.example` documents required variables without secrets.
- Document text is size-limited.
- Only plain-text upload is supported.
- Requests are validated with Zod on the server.
- User document text is never rendered as HTML.
- Internal server errors are not exposed to users.
- Documents are processed in-memory and not persisted.

## Accessibility

- Semantic headings and sections
- Labels for inputs, textareas, selects, and file upload
- Keyboard-focus-visible styles
- Live status region for loading and errors
- Buttons have accessible names and minimum target sizes
- Color is not the only indicator for risks
- Responsive layouts avoid horizontal overflow

## Testing

Implemented tests cover:

- Input validation
- File validation
- Local AI fallback behavior
- Clause extraction and risk formatting
- Comparison logic
- Chat/question workflow
- Loading/error-ready user workflows
- Main sample-document demo path

Coverage thresholds are set to practical hackathon levels in `vitest.config.ts`. They can be raised as the product grows.

## Performance

- No large unnecessary dependencies
- Vite optimized client build
- Server-side request validation before AI calls
- In-memory cache for repeated AI prompts
- Local deterministic fallback for demo resilience
- No document persistence or database overhead

## Setup

```bash
npm install
cp .env.example .env
```

Add a Gemini key to `.env` for live AI:

```text
GEMINI_API_KEY=your_key_here
```

Without a key, the app remains usable through clearly labelled local fallback behavior.

## Local Development

```bash
npm run dev
```

Client: `http://localhost:5173`  
API: `http://localhost:8787`

## Build

```bash
npm run build
```

## Test

```bash
npm test
```

## Lint

```bash
npm run lint
```

## Audit

```bash
npm audit
```

## Deployment

Deploy the React client as a static Vite app and deploy the Express API as a server or serverless function with `GEMINI_API_KEY` configured as a secret. Do not expose the key in client-side environment variables.

## Demo Workflow

1. Open the app.
2. Select "Use Sample Documents."
3. Click "Analyze."
4. Review summary, clauses, risks, obligations, dates, financial terms, checklist, and professional prep.
5. Ask: "Can I terminate this agreement?"
6. Click "Compare" to compare the original sample with the revised sample.

## Problem Statement Alignment

| Challenge requirement | Implemented feature |
| --- | --- |
| Simplify complex legal documents | Document Simplifier |
| Compare contracts, agreements, or policies | Document Compare |
| Highlight clauses, obligations, risks, inconsistencies | Clause Intelligence and Risk & Consistency Review |
| Answer questions based on documents | Document Q&A |
| Understand options and next steps | Guided Next Steps |
| Generate summaries/checklists | Plain-language Summary and Action Checklist |
| Prepare for legal professional | Professional Prep |
| Avoid replacing legal advice | Always-visible disclaimer and safety prompts |

## Limitations

- Plain-text upload is supported; PDF/DOCX parsing is intentionally excluded for a smaller secure demo surface.
- Local fallback is deterministic document assistance, not a replacement for live GenAI.
- The product provides legal information, not legal advice.

## Legal Disclaimer

LexiGuide AI provides legal information based on user-provided documents. It is not a lawyer, does not provide legal advice, does not create an attorney-client relationship, and does not produce legally binding conclusions. Consult a qualified legal professional before making legal decisions.
