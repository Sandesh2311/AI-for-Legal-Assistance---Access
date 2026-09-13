import { AlertTriangle, CheckSquare, FileSearch, Languages, MessageSquareText, Scale, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DISCLAIMER, SAMPLE_DOCUMENT_A, SAMPLE_DOCUMENT_B, TAGLINE } from './constants/legal';
import { analyzeDocument, askDocumentQuestion, compareDocuments } from './services/ai/client';
import type { AnalysisResult, ComparisonResult, Language, LegalDocumentInput, QaResult } from './types/legal';
import { UserFacingError, validateDocumentText, validateQuestion, validateTextFile } from './utils/validation';

const emptyDoc: LegalDocumentInput = { title: 'Document A', text: '' };

export function App() {
  const [documentA, setDocumentA] = useState<LegalDocumentInput>(emptyDoc);
  const [documentB, setDocumentB] = useState<LegalDocumentInput>({ title: 'Document B', text: '' });
  const [language, setLanguage] = useState<Language>('English');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [question, setQuestion] = useState('');
  const [qa, setQa] = useState<QaResult | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const hasDocument = documentA.text.trim().length > 0;
  const capabilities = useMemo(
    () => [
      ['Document Simplifier', 'Plain-language summaries, key points, parties, obligations, dates, fees, restrictions, and clause intelligence.'],
      ['Risk & Consistency Review', 'Flags ambiguous, broad, missing, or one-sided terms using careful informational language.'],
      ['Document Q&A', 'Answers questions grounded in the provided document and says when the document does not answer.'],
      ['Document Compare', 'Compares two versions for added, removed, and modified terms across legal categories.'],
    ],
    [],
  );

  async function runSafely(actionLabel: string, action: () => Promise<void>) {
    setBusy(true);
    setStatus(actionLabel);
    setError('');
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof UserFacingError || caught instanceof Error ? caught.message : 'Something went wrong. Please retry.');
    } finally {
      setBusy(false);
      setStatus('');
    }
  }

  function loadSamples() {
    setDocumentA({ title: 'Sample service agreement', text: SAMPLE_DOCUMENT_A });
    setDocumentB({ title: 'Sample revised agreement', text: SAMPLE_DOCUMENT_B });
    setAnalysis(null);
    setComparison(null);
    setQa(null);
    setError('');
  }

  async function handleFile(file: File | undefined, target: 'A' | 'B') {
    if (!file) return;
    await runSafely('Reading file...', async () => {
      validateTextFile(file);
      const text = await file.text();
      validateDocumentText(text, target === 'A' ? 'Document A' : 'Document B');
      if (target === 'A') setDocumentA({ title: file.name, text });
      if (target === 'B') setDocumentB({ title: file.name, text });
    });
  }

  function handleAnalyze() {
    void runSafely('Analyzing document...', async () => {
      const text = validateDocumentText(documentA.text, 'Document A');
      setAnalysis(await analyzeDocument(text, language));
      setQa(null);
    });
  }

  function handleCompare() {
    void runSafely('Comparing documents...', async () => {
      const a = validateDocumentText(documentA.text, 'Document A');
      const b = validateDocumentText(documentB.text, 'Document B');
      setComparison(await compareDocuments(a, b));
    });
  }

  function handleQuestion() {
    void runSafely('Answering from document...', async () => {
      const text = validateDocumentText(documentA.text, 'Document A');
      const validatedQuestion = validateQuestion(question);
      setQa(await askDocumentQuestion(text, validatedQuestion));
    });
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <nav aria-label="Main navigation" className="top-nav">
          <a href="#documents">Documents</a>
          <a href="#analysis">Analyze</a>
          <a href="#compare">Compare</a>
          <a href="#ask">Ask AI</a>
          <a href="#prep">Checklist</a>
        </nav>
        <div className="hero-content">
          <p className="eyebrow"><Scale size={18} aria-hidden="true" /> LexiGuide AI</p>
          <h1>Understand legal documents without the legal jargon.</h1>
          <p>{TAGLINE}</p>
          <div className="hero-actions">
            <button onClick={loadSamples} type="button">Use Sample Documents</button>
            <button className="secondary" onClick={handleAnalyze} disabled={!hasDocument || busy} type="button">
              Analyze Document
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="disclaimer" aria-label="Legal disclaimer">
          <ShieldCheck aria-hidden="true" />
          <span>{DISCLAIMER}</span>
        </section>

        <section className="capabilities" aria-label="Core capabilities">
          {capabilities.map(([title, description]) => (
            <article key={title}>
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </section>

        <section className="workspace" id="documents">
          <div className="section-heading">
            <h2>Legal Document Workspace</h2>
            <p>Paste or upload plain-text legal content. Sample content is clearly labelled as demo content.</p>
          </div>
          <div className="document-grid">
            <DocumentEditor doc={documentA} label="Document A" onChange={setDocumentA} onFile={(file) => void handleFile(file, 'A')} />
            <DocumentEditor doc={documentB} label="Document B for comparison" onChange={setDocumentB} onFile={(file) => void handleFile(file, 'B')} />
          </div>
          <div className="toolbar" role="group" aria-label="Document actions">
            <label className="language-select">
              <Languages size={18} aria-hidden="true" />
              Output language
              <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
                <option>English</option>
                <option>Hindi</option>
                <option>Hinglish</option>
              </select>
            </label>
            <button onClick={handleAnalyze} disabled={busy} type="button"><FileSearch aria-hidden="true" /> Analyze</button>
            <button onClick={handleCompare} disabled={busy} type="button"><Scale aria-hidden="true" /> Compare</button>
          </div>
          <StatusMessage busy={busy} status={status} error={error} />
        </section>

        <section id="analysis" className="results-section">
          <div className="section-heading">
            <h2>Document Understanding</h2>
            <p>Summary, clauses, risks, obligations, dates, financial terms, and restrictions.</p>
          </div>
          {analysis ? <AnalysisView analysis={analysis} /> : <EmptyState text="Analyze a document to generate structured legal-information outputs." />}
        </section>

        <section id="ask" className="qa-section">
          <div className="section-heading">
            <h2>Ask About The Document</h2>
            <p>Answers are grounded in Document A. Missing answers are called out explicitly.</p>
          </div>
          <div className="question-row">
            <label htmlFor="question">Question</label>
            <input id="question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Can I terminate this agreement?" />
            <button onClick={handleQuestion} disabled={busy} type="button"><MessageSquareText aria-hidden="true" /> Ask</button>
          </div>
          {qa && <ResultBlock title="Grounded Answer" items={[qa.answer, ...qa.citations.map((citation) => `Source: ${citation}`)]} fallback={qa.fallbackUsed} />}
        </section>

        <section id="compare" className="results-section">
          <div className="section-heading">
            <h2>Document A vs Document B</h2>
            <p>Review changed clauses, obligations, money terms, deadlines, liability, and dispute terms.</p>
          </div>
          {comparison ? <ComparisonView comparison={comparison} /> : <EmptyState text="Add two documents and run Compare to see important differences." />}
        </section>

        <section id="prep" className="prep-grid">
          <ResultBlock icon={<CheckSquare />} title="Action Checklist" items={analysis?.checklist || ['Analyze a document to generate a practical checklist.']} />
          <ResultBlock icon={<AlertTriangle />} title="Professional Prep" items={analysis ? [...analysis.lawyerQuestions, ...analysis.factsToGather] : ['Analysis will generate lawyer questions, facts to gather, and documents to bring.']} />
        </section>
      </main>
    </div>
  );
}

function DocumentEditor({ doc, label, onChange, onFile }: { doc: LegalDocumentInput; label: string; onChange: (doc: LegalDocumentInput) => void; onFile: (file?: File) => void }) {
  return (
    <article className="editor-panel">
      <label htmlFor={`${label}-title`}>{label} title</label>
      <input id={`${label}-title`} value={doc.title} onChange={(event) => onChange({ ...doc, title: event.target.value })} />
      <label htmlFor={`${label}-text`}>{label} text</label>
      <textarea id={`${label}-text`} value={doc.text} onChange={(event) => onChange({ ...doc, text: event.target.value })} rows={14} />
      <label className="file-input">
        Upload .txt file
        <input type="file" accept=".txt,text/plain" onChange={(event) => onFile(event.target.files?.[0])} />
      </label>
      <p className="char-count">{doc.text.length.toLocaleString()} characters</p>
    </article>
  );
}

function AnalysisView({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="analysis-grid">
      <ResultBlock title="Plain-Language Summary" items={[analysis.summary, ...analysis.keyPoints]} fallback={analysis.fallbackUsed} />
      <ResultBlock title="Parties & Obligations" items={[...analysis.parties, ...analysis.obligations]} />
      <ResultBlock title="Dates, Money & Restrictions" items={[...analysis.importantDates, ...analysis.financialObligations, ...analysis.restrictions]} />
      <ResultBlock title="Termination & Renewal" items={[...analysis.terminationConditions, ...analysis.renewalConditions]} />
      <article className="wide-panel">
        <h3>Important Clauses</h3>
        <div className="clause-list">
          {analysis.clauses.map((clause, index) => (
            <div key={`${clause.category}-${index}`} className="clause">
              <strong>{clause.category}</strong>
              <p>{clause.explanation}</p>
              <small>{clause.whyItMatters}</small>
              <blockquote>{clause.excerpt}</blockquote>
            </div>
          ))}
        </div>
      </article>
      <article className="wide-panel">
        <h3>Risk & Consistency Review</h3>
        {analysis.risks.map((risk, index) => (
          <div key={`${risk.title}-${index}`} className={`risk ${risk.severity.toLowerCase()}`}>
            <strong>{risk.severity}: {risk.title}</strong>
            <p>{risk.explanation}</p>
            {risk.source && <blockquote>{risk.source}</blockquote>}
          </div>
        ))}
      </article>
    </div>
  );
}

function ComparisonView({ comparison }: { comparison: ComparisonResult }) {
  return (
    <div className="analysis-grid">
      <ResultBlock title="What Changed?" items={[comparison.whatChanged]} fallback={comparison.fallbackUsed} />
      <ResultBlock title="Added Clauses" items={comparison.addedClauses} />
      <ResultBlock title="Removed Clauses" items={comparison.removedClauses} />
      <ResultBlock title="Modified Clauses" items={comparison.modifiedClauses} />
      <ResultBlock title="Changed Obligations" items={comparison.changedObligations} />
      <ResultBlock title="Financial & Deadlines" items={[...comparison.changedFinancialTerms, ...comparison.changedDeadlines]} />
      <ResultBlock title="Liability & Disputes" items={[...comparison.changedLiability, ...comparison.changedDisputeResolution]} />
      <ResultBlock title="Important Differences" items={comparison.importantDifferences} />
    </div>
  );
}

function ResultBlock({ title, items, fallback, icon }: { title: string; items: string[]; fallback?: boolean; icon?: React.ReactNode }) {
  return (
    <article className="result-block">
      <h3>{icon}{title}</h3>
      {fallback && <p className="fallback">Local fallback used because AI is unavailable or not configured.</p>}
      <ul>
        {(items.length ? items : ['No clearly supported items were found in the provided document.']).map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="empty-state">{text}</p>;
}

function StatusMessage({ busy, status, error }: { busy: boolean; status: string; error: string }) {
  return (
    <div className="status-region" role="status" aria-live="polite">
      {busy && <span>{status}</span>}
      {error && <span className="error">{error}</span>}
    </div>
  );
}
