import type { ClauseCategory } from '../types/legal';

export const APP_NAME = 'LexiGuide AI';
export const TAGLINE = 'Understand your documents. Know your options. Prepare with confidence.';
export const MAX_DOCUMENT_CHARS = 24000;
export const ACCEPTED_FILE_TYPES = ['text/plain'];

export const DISCLAIMER =
  'LexiGuide AI provides legal information based on your document. It is not a lawyer, does not provide legal advice, and does not create an attorney-client relationship.';

export const CLAUSE_KEYWORDS: Record<ClauseCategory, string[]> = {
  Payment: ['payment', 'fee', 'fees', 'invoice', 'compensation', 'deposit', 'late charge', 'interest'],
  Termination: ['terminate', 'termination', 'cancel', 'cancellation', 'breach', 'notice to terminate'],
  Renewal: ['renew', 'renewal', 'auto-renew', 'extension', 'successive term'],
  Liability: ['liability', 'liable', 'damages', 'limitation of liability', 'losses'],
  Indemnity: ['indemnify', 'indemnification', 'hold harmless', 'defend'],
  Confidentiality: ['confidential', 'non-disclosure', 'proprietary information', 'trade secret'],
  'Intellectual Property': ['intellectual property', 'copyright', 'trademark', 'license', 'ownership'],
  'Dispute Resolution': ['arbitration', 'mediation', 'dispute', 'court', 'venue'],
  'Governing Law': ['governing law', 'laws of', 'jurisdiction'],
  'Data/Privacy': ['privacy', 'personal data', 'data protection', 'security', 'processing'],
  Restrictions: ['non-compete', 'non-solicit', 'restriction', 'exclusive', 'prohibited'],
  'Deadline/Notice': ['days', 'deadline', 'notice period', 'written notice', 'within'],
  Other: [],
};

export const SAMPLE_DOCUMENT_A = `DEMO SAMPLE DOCUMENT - Service Agreement

This Service Agreement is entered into by BrightPath Design LLC ("Provider") and Green Valley Retail Inc. ("Client") on January 15, 2026.

Provider will design and maintain Client's ecommerce landing pages for an initial term of twelve months. Client must provide brand assets, product information, and written approvals within five business days of each request.

Client will pay Provider $3,500 per month, due within 15 days after invoice receipt. Late payments may incur interest of 1.5% per month. Provider may pause work if payment is more than 20 days late.

Either party may terminate this Agreement with 30 days' written notice. Provider may terminate immediately if Client fails to pay undisputed fees after written notice and a 10-day cure period.

The Agreement automatically renews for successive one-year terms unless either party gives written notice of non-renewal at least 45 days before the current term ends.

Each party must keep confidential business, pricing, technical, and customer information secret for three years after termination.

Provider owns pre-existing tools and templates. Client owns final approved deliverables after all undisputed invoices are paid in full.

Provider's total liability is limited to fees paid by Client during the three months before the claim. Provider is not liable for indirect or consequential damages.

Disputes must first be discussed by senior managers. If unresolved after 20 days, disputes will be resolved by binding arbitration in Austin, Texas. This Agreement is governed by Texas law.`;

export const SAMPLE_DOCUMENT_B = `DEMO SAMPLE DOCUMENT - Revised Service Agreement

This Service Agreement is entered into by BrightPath Design LLC ("Provider") and Green Valley Retail Inc. ("Client") on January 15, 2026.

Provider will design and maintain Client's ecommerce landing pages for an initial term of twenty-four months. Client must provide brand assets, product information, and written approvals within three business days of each request.

Client will pay Provider $4,200 per month, due within 10 days after invoice receipt. Late payments may incur interest of 2% per month. Provider may pause work if payment is more than 10 days late.

Client may terminate this Agreement with 60 days' written notice. Provider may terminate immediately if Client fails to pay undisputed fees after written notice and a 5-day cure period.

The Agreement automatically renews for successive one-year terms unless either party gives written notice of non-renewal at least 60 days before the current term ends.

Each party must keep confidential business, pricing, technical, and customer information secret for five years after termination.

Provider owns pre-existing tools and templates. Client receives a non-exclusive license to final approved deliverables after all undisputed invoices are paid in full.

Client will indemnify Provider for third-party claims arising from Client's product information, advertising claims, or provided materials.

Provider's total liability is limited to fees paid by Client during the one month before the claim. Provider is not liable for indirect, incidental, special, or consequential damages.

Disputes will be resolved by binding arbitration in Dallas, Texas. This Agreement is governed by Texas law.`;
