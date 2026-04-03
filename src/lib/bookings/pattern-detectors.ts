import type { JournalEntryLine } from "@/lib/data/journal-entry.types";
import type { BookingFlag } from "./booking.types";
import { normalizeForComparison } from "./text-anomaly-detector";

/** Map key format: "documentId:lineId" */
type FlagMap = Map<string, BookingFlag[]>;

function flagKey(documentId: string, lineId: number): string {
  return `${documentId}:${lineId}`;
}

function addFlag(map: FlagMap, key: string, flag: BookingFlag): void {
  const existing = map.get(key) ?? [];
  existing.push(flag);
  map.set(key, existing);
}

const now = new Date().toISOString();

/**
 * Detect amounts that are statistical outliers within their GL account.
 * Groups lines by gl_account, computes mean and standard deviation,
 * and flags lines where the amount exceeds 2.5 standard deviations.
 */
export function detectUnusualAmounts(lines: JournalEntryLine[]): FlagMap {
  const result: FlagMap = new Map();

  // Group lines by gl_account
  const accountLines = new Map<string, JournalEntryLine[]>();
  for (const line of lines) {
    const existing = accountLines.get(line.gl_account) ?? [];
    existing.push(line);
    accountLines.set(line.gl_account, existing);
  }

  for (const [account, acctLines] of accountLines) {
    if (acctLines.length < 10) continue;

    const amounts = acctLines.map((l) => l.amount);
    const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const variance =
      amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) continue;

    for (const line of acctLines) {
      const zScore = Math.abs(line.amount - mean) / stdDev;
      if (zScore > 2.5) {
        addFlag(result, flagKey(line.document_id, line.line_id), {
          type: "unusual_amount",
          severity: "warning",
          explanation: `Amount ${line.amount.toFixed(2)} on account ${account} is ${zScore.toFixed(1)} standard deviations from the mean (${mean.toFixed(2)})`,
          confidence: Math.min(zScore / 5, 1),
          detectedAt: now,
          relatedDocumentId: null,
        });
      }
    }
  }

  return result;
}

/** Check if an amount is a "round" number (divisible by 1000) */
function isRoundNumber(amount: number): boolean {
  return amount >= 5000 && amount % 1000 === 0;
}

/**
 * Detect suspiciously round amounts on accounts that normally have
 * non-round amounts. Flags lines where the amount is divisible by 1000,
 * >= 5000, and the account has < 20% round amounts overall.
 */
export function detectRoundNumberAnomalies(lines: JournalEntryLine[]): FlagMap {
  const result: FlagMap = new Map();

  // Group lines by gl_account
  const accountLines = new Map<string, JournalEntryLine[]>();
  for (const line of lines) {
    const existing = accountLines.get(line.gl_account) ?? [];
    existing.push(line);
    accountLines.set(line.gl_account, existing);
  }

  for (const [, acctLines] of accountLines) {
    if (acctLines.length < 5) continue;

    const roundCount = acctLines.filter((l) => isRoundNumber(l.amount)).length;
    const roundRatio = roundCount / acctLines.length;

    // Only flag if < 20% of amounts on this account are round
    if (roundRatio >= 0.2) continue;

    for (const line of acctLines) {
      if (isRoundNumber(line.amount)) {
        addFlag(result, flagKey(line.document_id, line.line_id), {
          type: "round_number_anomaly",
          severity: "warning",
          explanation: `Amount ${line.amount.toFixed(2)} is a suspiciously round number (only ${Math.round(roundRatio * 100)}% of amounts on this account are round)`,
          confidence: 0.6,
          detectedAt: now,
          relatedDocumentId: null,
        });
      }
    }
  }

  return result;
}

/**
 * Detect pattern breaks: when a booking text that normally goes to one
 * cost center suddenly goes to a different one.
 */
export function detectPatternBreaks(lines: JournalEntryLine[]): FlagMap {
  const result: FlagMap = new Map();

  // Cost center pattern breaks:
  // Group by normalized booking text, find dominant cost center,
  // flag outliers.
  const textCostCenters = new Map<string, Map<string, JournalEntryLine[]>>();
  const textTotals = new Map<string, number>();

  for (const line of lines) {
    if (!line.cost_center) continue;

    const text = normalizeForComparison(line.booking_text);
    if (!textCostCenters.has(text)) {
      textCostCenters.set(text, new Map());
    }
    const ccMap = textCostCenters.get(text)!;
    const existing = ccMap.get(line.cost_center) ?? [];
    existing.push(line);
    ccMap.set(line.cost_center, existing);
    textTotals.set(text, (textTotals.get(text) ?? 0) + 1);
  }

  for (const [text, ccMap] of textCostCenters) {
    const total = textTotals.get(text)!;
    if (total < 5) continue;

    // Find the dominant cost center
    let dominantCC = "";
    let dominantCount = 0;
    for (const [cc, ccLines] of ccMap) {
      if (ccLines.length > dominantCount) {
        dominantCount = ccLines.length;
        dominantCC = cc;
      }
    }

    // Only flag if there's a clear dominant (>= 70% on one cost center)
    if (dominantCount / total < 0.7) continue;

    // Flag lines on non-dominant cost centers
    for (const [cc, ccLines] of ccMap) {
      if (cc === dominantCC) continue;
      for (const line of ccLines) {
        addFlag(result, flagKey(line.document_id, line.line_id), {
          type: "pattern_break",
          severity: "warning",
          explanation: `"${text}" is usually posted to cost center ${dominantCC} (${dominantCount}/${total} times) but this line uses ${cc}`,
          confidence: dominantCount / total,
          detectedAt: now,
          relatedDocumentId: null,
        });
      }
    }
  }

  return result;
}

/**
 * Detect documents where all lines are on the same side (all debit or
 * all credit). A properly balanced document should have both S and H lines.
 */
export function detectMissingCounterparts(lines: JournalEntryLine[]): FlagMap {
  const result: FlagMap = new Map();

  // Group lines by document_id
  const documents = new Map<string, JournalEntryLine[]>();
  for (const line of lines) {
    const docLines = documents.get(line.document_id) ?? [];
    docLines.push(line);
    documents.set(line.document_id, docLines);
  }

  for (const [, docLines] of documents) {
    if (docLines.length < 2) continue;

    const hasDebit = docLines.some((l) => l.debit_credit === "S");
    const hasCredit = docLines.some((l) => l.debit_credit === "H");

    if (hasDebit && hasCredit) continue;

    const side = hasDebit ? "debit (S)" : "credit (H)";
    for (const line of docLines) {
      addFlag(result, flagKey(line.document_id, line.line_id), {
        type: "missing_counterpart",
        severity: "critical",
        explanation: `Document ${line.document_id} has all lines on the ${side} side — no counterpart entry found`,
        confidence: 0.95,
        detectedAt: now,
        relatedDocumentId: null,
      });
    }
  }

  return result;
}
