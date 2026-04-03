import type { JournalEntryLine } from "@/lib/data/journal-entry.types";
import type { BookingFlag } from "./booking.types";
import { levenshteinDistance } from "./levenshtein";

/** Map key format: "documentId:lineId" */
type FlagMap = Map<string, BookingFlag[]>;

/** Summary of a document derived from its journal entry lines */
export interface DocumentSummary {
  documentId: string;
  totalAmount: number;
  primaryGlAccount: string;
  contraGlAccount: string | null;
  postingDate: string;
  bookingText: string;
  documentType: string;
  vendorId: string | null;
  customerId: string | null;
  costCenter: string | null;
  taxCode: string | null;
}

interface PairScoreResult {
  score: number;
  activeWeight: number;
  signals: {
    amount: number;
    vendorCustomer: number;
    glAccount: number;
    contraAccount: number;
    postingDate: number;
    bookingText: number;
    documentType: number;
    costCenter: number;
    taxCode: number;
  };
  matchedCriteria: string[];
}

const WEIGHTS = {
  amount: 0.25,
  vendorCustomer: 0.2,
  glAccount: 0.15,
  contraAccount: 0.1,
  postingDate: 0.1,
  bookingText: 0.1,
  documentType: 0.05,
  costCenter: 0.03,
  taxCode: 0.02,
} as const;

/** Invoice doc types and their corresponding payment types */
const INVOICE_TYPES = new Set(["KR", "DR"]);
const PAYMENT_TYPES = new Set(["KZ", "DZ"]);

const AMOUNT_ABSOLUTE_FLOOR = 0.5;

const now = new Date().toISOString();

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

function scoreAmount(amountA: number, amountB: number): number {
  const diff = Math.abs(amountA - amountB);
  if (diff <= AMOUNT_ABSOLUTE_FLOOR) return 1.0;
  return 0.0;
}

function scoreVendorCustomer(
  a: DocumentSummary,
  b: DocumentSummary,
): { score: number; isActive: boolean } {
  // Check vendor
  if (a.vendorId && b.vendorId) {
    return { score: a.vendorId === b.vendorId ? 1.0 : 0.0, isActive: true };
  }
  // Check customer
  if (a.customerId && b.customerId) {
    return {
      score: a.customerId === b.customerId ? 1.0 : 0.0,
      isActive: true,
    };
  }
  // Both null -> no signal
  if (!a.vendorId && !b.vendorId && !a.customerId && !b.customerId) {
    return { score: 0.0, isActive: false };
  }
  // One has vendor/customer, other doesn't -> mismatch
  return { score: 0.0, isActive: true };
}

function scorePostingDate(dateA: string, dateB: string): number {
  const days = daysBetween(dateA, dateB);
  if (days === 0) return 1.0;
  if (days <= 1) return 0.8;
  if (days <= 2) return 0.6;
  if (days <= 5) return 0.3;
  return 0.0;
}

function scoreBookingText(textA: string, textB: string): number {
  const normA = textA.toLowerCase().trim();
  const normB = textB.toLowerCase().trim();
  if (normA === normB) return 1.0;
  const dist = levenshteinDistance(normA, normB);
  if (dist <= 2) return 0.7;
  if (dist <= 3) return 0.4;
  return 0.0;
}

function scoreNullableMatch(
  a: string | null,
  b: string | null,
): { score: number; isActive: boolean } {
  if (a === null && b === null) return { score: 0.0, isActive: false };
  if (a === b) return { score: 1.0, isActive: true };
  return { score: 0.0, isActive: true };
}

/** Check if the pair is an invoice+payment pair that should be excluded */
function isInvoicePaymentPair(
  docA: DocumentSummary,
  docB: DocumentSummary,
): boolean {
  return (
    (INVOICE_TYPES.has(docA.documentType) &&
      PAYMENT_TYPES.has(docB.documentType)) ||
    (PAYMENT_TYPES.has(docA.documentType) &&
      INVOICE_TYPES.has(docB.documentType))
  );
}

/** Compute the weighted duplicate score for a pair of documents */
export function computePairScore(
  docA: DocumentSummary,
  docB: DocumentSummary,
): PairScoreResult {
  const matchedCriteria: string[] = [];

  // Compute individual signals
  const amountScore = scoreAmount(docA.totalAmount, docB.totalAmount);
  const vcResult = scoreVendorCustomer(docA, docB);
  const glScore = docA.primaryGlAccount === docB.primaryGlAccount ? 1.0 : 0.0;
  const contraScore =
    docA.contraGlAccount && docB.contraGlAccount
      ? docA.contraGlAccount === docB.contraGlAccount
        ? 1.0
        : 0.0
      : docA.contraGlAccount === null && docB.contraGlAccount === null
        ? 0.0
        : 0.0;
  const dateScore = scorePostingDate(docA.postingDate, docB.postingDate);
  const textScore = scoreBookingText(docA.bookingText, docB.bookingText);
  const docTypeScore = docA.documentType === docB.documentType ? 1.0 : 0.0;
  const ccResult = scoreNullableMatch(docA.costCenter, docB.costCenter);
  const taxResult = scoreNullableMatch(docA.taxCode, docB.taxCode);

  // Build matched criteria descriptions
  if (amountScore > 0) {
    const diff = Math.abs(docA.totalAmount - docB.totalAmount);
    if (diff < 0.01) {
      matchedCriteria.push("same amount");
    } else {
      matchedCriteria.push(`same amount (diff ${diff.toFixed(2)} EUR)`);
    }
  }

  if (vcResult.score > 0) {
    const id = docA.vendorId ?? docA.customerId;
    matchedCriteria.push(`same vendor (${id})`);
  }

  if (glScore > 0) {
    matchedCriteria.push(`same account ${docA.primaryGlAccount}`);
  }

  if (contraScore > 0) {
    matchedCriteria.push(`same contra account ${docA.contraGlAccount}`);
  }

  if (dateScore > 0) {
    const days = daysBetween(docA.postingDate, docB.postingDate);
    if (days === 0) {
      matchedCriteria.push("same posting date");
    } else {
      matchedCriteria.push(`posted ${days} day${days !== 1 ? "s" : ""} apart`);
    }
  }

  if (textScore > 0) {
    if (textScore === 1.0) {
      matchedCriteria.push("identical text");
    } else {
      matchedCriteria.push("similar text");
    }
  }

  // Calculate weighted score, adjusting for inactive signals
  let activeWeight = 1.0;
  if (!vcResult.isActive) activeWeight -= WEIGHTS.vendorCustomer;
  if (!ccResult.isActive) activeWeight -= WEIGHTS.costCenter;
  if (!taxResult.isActive) activeWeight -= WEIGHTS.taxCode;

  const rawScore =
    WEIGHTS.amount * amountScore +
    (vcResult.isActive ? WEIGHTS.vendorCustomer * vcResult.score : 0) +
    WEIGHTS.glAccount * glScore +
    WEIGHTS.contraAccount * contraScore +
    WEIGHTS.postingDate * dateScore +
    WEIGHTS.bookingText * textScore +
    WEIGHTS.documentType * docTypeScore +
    (ccResult.isActive ? WEIGHTS.costCenter * ccResult.score : 0) +
    (taxResult.isActive ? WEIGHTS.taxCode * taxResult.score : 0);

  // Normalize by active weight so inactive signals don't dilute the score
  const score = activeWeight > 0 ? rawScore / activeWeight : 0;

  return {
    score,
    activeWeight,
    signals: {
      amount: amountScore,
      vendorCustomer: vcResult.score,
      glAccount: glScore,
      contraAccount: contraScore,
      postingDate: dateScore,
      bookingText: textScore,
      documentType: docTypeScore,
      costCenter: ccResult.score,
      taxCode: taxResult.score,
    },
    matchedCriteria,
  };
}

/** Build a document summary from its journal entry lines */
function summarizeDocument(lines: JournalEntryLine[]): DocumentSummary {
  const sorted = [...lines].sort((a, b) => a.line_id - b.line_id);
  const primary = sorted[0];

  // Primary line: first debit line, or first line if no debit
  const firstDebit = sorted.find((l) => l.debit_credit === "S");
  const primaryLine = firstDebit ?? primary;

  // Contra line: first line on opposite side from primary
  const contraLine = sorted.find(
    (l) => l.debit_credit !== primaryLine.debit_credit,
  );

  // Total amount: sum of debit side
  const totalAmount = sorted
    .filter((l) => l.debit_credit === "S")
    .reduce((sum, l) => sum + l.amount, 0);

  // Vendor/customer from any line in the document
  const vendorId = sorted.find((l) => l.vendor_id)?.vendor_id ?? null;
  const customerId = sorted.find((l) => l.customer_id)?.customer_id ?? null;

  // Cost center from primary line
  const costCenter = primaryLine.cost_center;

  // Tax code from primary line
  const taxCode = primaryLine.tax_code;

  return {
    documentId: primaryLine.document_id,
    totalAmount,
    primaryGlAccount: primaryLine.gl_account,
    contraGlAccount: contraLine?.gl_account ?? null,
    postingDate: primaryLine.posting_date,
    bookingText: primaryLine.booking_text,
    documentType: primaryLine.document_type,
    vendorId,
    customerId,
    costCenter,
    taxCode,
  };
}

function buildExplanation(
  otherDocId: string,
  matchedCriteria: string[],
): string {
  const criteriaStr = matchedCriteria.join(", ");
  return `Possible duplicate of ${otherDocId}: ${criteriaStr}.`;
}

function severityFromScore(score: number): "critical" | "warning" | undefined {
  if (score >= 0.75) return "critical";
  if (score >= 0.35) return "warning";
  return undefined;
}

/**
 * Detect duplicate bookings by comparing all document pairs with
 * multi-signal weighted scoring.
 */
export function detectDuplicateBookings(lines: JournalEntryLine[]): FlagMap {
  const result: FlagMap = new Map();

  // Group lines by document_id
  const documentLines = new Map<string, JournalEntryLine[]>();
  for (const line of lines) {
    const docLines = documentLines.get(line.document_id) ?? [];
    docLines.push(line);
    documentLines.set(line.document_id, docLines);
  }

  // Build document summaries
  const documents: DocumentSummary[] = [];
  for (const [, docLines] of documentLines) {
    documents.push(summarizeDocument(docLines));
  }

  // Compare all document pairs (O(n^2), fine for current dataset size)
  for (let i = 0; i < documents.length; i++) {
    for (let j = i + 1; j < documents.length; j++) {
      const docA = documents[i];
      const docB = documents[j];

      // Gate: same document
      if (docA.documentId === docB.documentId) continue;

      // Gate: invoice+payment pair
      if (isInvoicePaymentPair(docA, docB)) continue;

      const pairResult = computePairScore(docA, docB);

      // Gate: amount match is required — same vendor + same account alone is
      // normal business activity, not a duplicate
      if (pairResult.signals.amount === 0) continue;

      const severity = severityFromScore(pairResult.score);
      if (!severity) continue;

      // Flag all lines in both documents
      const explanationAtoB = buildExplanation(
        docB.documentId,
        pairResult.matchedCriteria,
      );
      const explanationBtoA = buildExplanation(
        docA.documentId,
        pairResult.matchedCriteria,
      );

      const docALines = documentLines.get(docA.documentId) ?? [];
      const docBLines = documentLines.get(docB.documentId) ?? [];

      for (const line of docALines) {
        const key = `${line.document_id}:${line.line_id}`;
        const existing = result.get(key) ?? [];
        existing.push({
          type: "duplicate_booking",
          severity,
          explanation: explanationAtoB,
          confidence: pairResult.score,
          detectedAt: now,
          relatedDocumentId: docB.documentId,
        });
        result.set(key, existing);
      }

      for (const line of docBLines) {
        const key = `${line.document_id}:${line.line_id}`;
        const existing = result.get(key) ?? [];
        existing.push({
          type: "duplicate_booking",
          severity,
          explanation: explanationBtoA,
          confidence: pairResult.score,
          detectedAt: now,
          relatedDocumentId: docA.documentId,
        });
        result.set(key, existing);
      }
    }
  }

  return result;
}
