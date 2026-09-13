import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { analysisPayload, comparisonPayload, qaPayload, SAMPLE_DOCUMENT_A, validDocument } from './fixtures';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.includes('/api/ask')) return new Response(JSON.stringify(qaPayload));
      if (url.includes('/api/compare')) return new Response(JSON.stringify(comparisonPayload));
      return new Response(JSON.stringify(analysisPayload));
    }),
  );
});

describe('App', () => {
  it('loads sample documents and analyzes them', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /use sample documents/i }));
    expect(screen.getByLabelText(/document a text/i)).toHaveValue(SAMPLE_DOCUMENT_A);

    await user.click(screen.getByRole('button', { name: /^analyze$/i }));
    expect(await screen.findByText('Plain summary')).toBeInTheDocument();
    expect(screen.getByText('Local fallback used because AI is unavailable or not configured.')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Medium: Broad wording')).toBeInTheDocument();
    expect(screen.getByText('Verify payment terms')).toBeInTheDocument();
    expect(screen.getByText('Is the termination clause reasonable?')).toBeInTheDocument();
  });

  it('asks a grounded document question', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /use sample documents/i }));
    await user.type(screen.getByLabelText(/question/i), 'Can I terminate?');
    await user.click(screen.getByRole('button', { name: /^ask$/i }));

    expect(await screen.findByText('Use 30 days notice.')).toBeInTheDocument();
  });

  it('compares two documents', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /use sample documents/i }));
    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    await waitFor(() => expect(screen.getByText('Payment changed.')).toBeInTheDocument());
    expect(screen.getByText('B adds indemnity.')).toBeInTheDocument();
  });

  it('shows accessible empty states and legal disclaimer on first render', () => {
    render(<App />);

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/legal disclaimer/i)).toHaveTextContent('does not provide legal advice');
    expect(screen.getByText('Analyze a document to generate structured legal-information outputs.')).toBeInTheDocument();
    expect(screen.getByText('Add two documents and run Compare to see important differences.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze document/i })).toBeDisabled();
  });

  it('validates empty and short document workflows through the UI', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /^analyze$/i }));
    expect(await screen.findByText('Document A is required.')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/document a text/i), 'too short');
    await user.click(screen.getByRole('button', { name: /^analyze$/i }));
    expect(await screen.findByText('Document A needs at least 80 characters for a useful review.')).toBeInTheDocument();
  });

  it('handles valid and invalid text file uploads', async () => {
    const user = userEvent.setup();
    render(<App />);

    const fileInputs = screen.getAllByLabelText(/upload \.txt file/i);
    fireEvent.change(fileInputs[0], { target: { files: [new File([validDocument], 'agreement.txt', { type: 'text/plain' })] } });
    await waitFor(() => expect(screen.getByLabelText(/document a text/i)).toHaveValue(validDocument));

    await user.upload(fileInputs[1], new File(['%PDF'], 'agreement.pdf', { type: 'application/pdf' }));
    expect(await screen.findByText('Only plain text .txt files are supported in this demo.')).toBeInTheDocument();
  });

  it('sends selected language and handles service errors', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'The AI service is unavailable. Please retry.' }), { status: 503 }));
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText(/output language/i), 'Hindi');
    fireEvent.change(screen.getByLabelText(/document a text/i), { target: { value: validDocument } });
    await user.click(screen.getByRole('button', { name: /^analyze$/i }));

    expect(await screen.findByText('The AI service is unavailable. Please retry.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/analyze'),
      expect.objectContaining({ body: expect.stringContaining('"language":"Hindi"') }),
    );
  });

  it('validates empty questions and comparison input', async () => {
    const user = userEvent.setup();
    render(<App />);

    fireEvent.change(screen.getByLabelText(/document a text/i), { target: { value: validDocument } });
    await user.click(screen.getByRole('button', { name: /^ask$/i }));
    expect(await screen.findByText('Ask a question about the document first.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^compare$/i }));
    expect(await screen.findByText('Document B is required.')).toBeInTheDocument();
  });
});
