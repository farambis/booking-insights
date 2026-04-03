import type { JournalEntryLine } from "@/lib/data/journal-entry.types";
import type { BookingFlag } from "./booking.types";
import { levenshteinDistance } from "./levenshtein";

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

/** Confidence based on Levenshtein distance: 1->0.9, 2->0.7, 3->0.5 */
function typoConfidence(distance: number): number {
  if (distance === 1) return 0.9;
  if (distance === 2) return 0.7;
  return 0.5;
}

/**
 * Detect suspected typos via pairwise Levenshtein distance on unique booking texts.
 * The less frequent text in each near-duplicate pair is flagged.
 */
export function detectTypos(lines: JournalEntryLine[]): FlagMap {
  const result: FlagMap = new Map();

  // Build text -> count and text -> lines mappings
  const textCount = new Map<string, number>();
  const textLines = new Map<string, JournalEntryLine[]>();

  for (const line of lines) {
    const text = line.booking_text;
    textCount.set(text, (textCount.get(text) ?? 0) + 1);
    const existing = textLines.get(text) ?? [];
    existing.push(line);
    textLines.set(text, existing);
  }

  const uniqueTexts = [...textCount.keys()];

  // Pairwise comparison
  for (let i = 0; i < uniqueTexts.length; i++) {
    for (let j = i + 1; j < uniqueTexts.length; j++) {
      const a = uniqueTexts[i];
      const b = uniqueTexts[j];

      // Skip pairs where length difference exceeds 3
      if (Math.abs(a.length - b.length) > 3) continue;

      const distance = levenshteinDistance(a, b);
      if (distance < 1 || distance > 3) continue;

      // The less frequent text is the suspected typo
      const countA = textCount.get(a)!;
      const countB = textCount.get(b)!;
      const [typoText, correctText] = countA <= countB ? [a, b] : [b, a];

      const confidence = typoConfidence(distance);
      const typoLines = textLines.get(typoText)!;

      for (const line of typoLines) {
        addFlag(result, flagKey(line.document_id, line.line_id), {
          type: "text_typo",
          severity: "warning",
          explanation: `"${typoText}" may be a typo of "${correctText}" (edit distance: ${distance})`,
          confidence,
          detectedAt: now,
          relatedDocumentId: null,
        });
      }
    }
  }

  return result;
}

/**
 * Detect unusual text-account combinations using frequency analysis.
 * Flags lines where the text has >= 3 total occurrences and the account
 * holds < 10% of that text's total.
 */
export function detectUnusualTextAccountCombos(
  lines: JournalEntryLine[],
): FlagMap {
  const result: FlagMap = new Map();

  // Build text -> account -> count
  const textAccountCounts = new Map<string, Map<string, number>>();
  const textTotals = new Map<string, number>();

  for (const line of lines) {
    const text = line.booking_text;
    const account = line.gl_account;

    if (!textAccountCounts.has(text)) {
      textAccountCounts.set(text, new Map());
    }
    const accountMap = textAccountCounts.get(text)!;
    accountMap.set(account, (accountMap.get(account) ?? 0) + 1);
    textTotals.set(text, (textTotals.get(text) ?? 0) + 1);
  }

  // Flag unusual combinations
  for (const line of lines) {
    const text = line.booking_text;
    const account = line.gl_account;
    const total = textTotals.get(text)!;

    if (total < 3) continue;

    const accountCount = textAccountCounts.get(text)!.get(account)!;
    const ratio = accountCount / total;

    if (ratio < 0.1) {
      const confidence = 1 - ratio;
      addFlag(result, flagKey(line.document_id, line.line_id), {
        type: "unusual_text_account",
        severity: "warning",
        explanation: `"${text}" is rarely posted to account ${account} (${accountCount}/${total} = ${Math.round(ratio * 100)}%)`,
        confidence,
        detectedAt: now,
        relatedDocumentId: null,
      });
    }
  }

  return result;
}

/**
 * Detect suspiciously similar documents by comparing document signatures
 * (sorted text+account tuples) and posting dates within 2 calendar days.
 */
export function detectTextDuplicatePostings(
  lines: JournalEntryLine[],
): FlagMap {
  const result: FlagMap = new Map();

  // Group lines by document
  const documents = new Map<
    string,
    { lines: JournalEntryLine[]; postingDate: string }
  >();
  for (const line of lines) {
    if (!documents.has(line.document_id)) {
      documents.set(line.document_id, {
        lines: [],
        postingDate: line.posting_date,
      });
    }
    documents.get(line.document_id)!.lines.push(line);
  }

  // Build signatures: sorted set of (booking_text, gl_account) tuples
  const docSignatures = new Map<string, string>();
  for (const [docId, doc] of documents) {
    const tuples = doc.lines
      .map((l) => `${l.booking_text}|${l.gl_account}`)
      .sort();
    // Deduplicate tuples for the signature
    const uniqueTuples = [...new Set(tuples)];
    docSignatures.set(docId, uniqueTuples.join(";;"));
  }

  // Group documents by signature
  const signatureGroups = new Map<string, string[]>();
  for (const [docId, sig] of docSignatures) {
    const group = signatureGroups.get(sig) ?? [];
    group.push(docId);
    signatureGroups.set(sig, group);
  }

  // Check pairs within each signature group
  for (const docIds of signatureGroups.values()) {
    if (docIds.length < 2) continue;

    for (let i = 0; i < docIds.length; i++) {
      for (let j = i + 1; j < docIds.length; j++) {
        const docA = documents.get(docIds[i])!;
        const docB = documents.get(docIds[j])!;

        const dateA = new Date(docA.postingDate + "T00:00:00");
        const dateB = new Date(docB.postingDate + "T00:00:00");
        const daysDiff =
          Math.abs(dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff > 2) continue;

        // Flag all lines in both documents
        for (const line of docA.lines) {
          addFlag(result, flagKey(line.document_id, line.line_id), {
            type: "text_duplicate_posting",
            severity: "critical",
            explanation: `Document ${docIds[i]} and ${docIds[j]} have identical text-account signatures and were posted ${daysDiff} day(s) apart`,
            confidence: 0.8,
            detectedAt: now,
            relatedDocumentId: docIds[j],
          });
        }

        for (const line of docB.lines) {
          addFlag(result, flagKey(line.document_id, line.line_id), {
            type: "text_duplicate_posting",
            severity: "critical",
            explanation: `Document ${docIds[j]} and ${docIds[i]} have identical text-account signatures and were posted ${daysDiff} day(s) apart`,
            confidence: 0.8,
            detectedAt: now,
            relatedDocumentId: docIds[i],
          });
        }
      }
    }
  }

  return result;
}

/**
 * Orchestrator: run all three text anomaly detectors and merge results.
 */
export function detectTextAnomalies(lines: JournalEntryLine[]): FlagMap {
  const merged: FlagMap = new Map();

  const detectors = [
    detectTypos,
    detectUnusualTextAccountCombos,
    detectTextDuplicatePostings,
  ];

  for (const detect of detectors) {
    const flags = detect(lines);
    for (const [key, flagList] of flags) {
      const existing = merged.get(key) ?? [];
      existing.push(...flagList);
      merged.set(key, existing);
    }
  }

  return merged;
}
