# Testing Strategy

LexiGuide AI uses Vitest, React Testing Library, and Supertest to verify application behavior without real Gemini calls or external network dependencies.

## Unit Testing

Unit tests cover validation, text utilities, deterministic document analysis, clause categorization, risk detection, checklist generation, next-step generation, lawyer-prep questions, local Q&A, and local comparison behavior.

## Component Testing

React Testing Library tests exercise the main user workflows:

- initial empty states and legal disclaimer
- sample document loading
- document analysis
- clause and risk rendering
- checklist and professional-prep rendering
- grounded Q&A
- document comparison
- upload validation
- language selection
- service error display

## Integration Testing

Supertest covers the Express API boundary for health checks, request validation, successful AI responses, fallback activation, and request caching.

## AI Mocking Strategy

Gemini is never called during automated tests. The server app accepts an injected AI generator in tests, and `@google/generative-ai` is mocked in provider tests. Tests cover successful JSON, fenced JSON, missing API key, provider failure, malformed response, and empty response behavior.

## Fallback Testing

Fallback behavior is tested for document analysis, document Q&A, comparison, server AI failure, and repeated cached requests. Assertions verify `fallbackUsed` remains distinguishable from successful AI output.

## Validation Testing

Validation tests cover empty input, whitespace-only input, valid input, minimum and maximum document boundaries, oversized input, valid text files, unsupported file types, oversized files, malformed server payloads, and invalid language/question boundaries.

## Edge Cases

Edge-case tests include sparse documents, ambiguous wording, missing termination terms, no-fabrication expectations, repeated irrelevant questions, special characters, Unicode/Hindi text, Hinglish output, identical documents, and one-sided empty comparisons.

## Current Coverage

The target thresholds are:

- Statements: 95%
- Functions: 95%
- Lines: 95%
- Branches: 90%

Run the latest report with:

```bash
npm test
```
