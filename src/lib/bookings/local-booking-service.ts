import journalEntries from "@/lib/data/journal-entries.json";
import { GL_ACCOUNTS, COST_CENTERS } from "@/lib/data/account-master";
import type { JournalEntryLine } from "@/lib/data/journal-entry.types";
import type {
  BookingDetail,
  BookingFlag,
  BookingStatus,
  DocumentLine,
} from "./booking.types";
import type { BookingService } from "./booking-service";
import {
  queryBookings,
  buildDashboardSummary,
  findRelated,
} from "./booking-queries";
import { detectTextAnomalies } from "./text-anomaly-detector";
import { detectDuplicateBookings } from "./duplicate-detector";
import {
  detectUnusualAmounts,
  detectRoundNumberAnomalies,
  detectPatternBreaks,
  detectMissingCounterparts,
} from "./pattern-detectors";
import { mineBookingRules } from "./rule-miner";
import { findRuleViolations } from "./rule-violations";
import type { BookingManual } from "./rule.types";

function lookupAccountName(glAccount: string): string | null {
  return GL_ACCOUNTS.find((a) => a.number === glAccount)?.name ?? null;
}

function lookupCostCenterName(costCenter: string | null): string | null {
  if (!costCenter) return null;
  return COST_CENTERS.find((c) => c.id === costCenter)?.name ?? null;
}

function deriveStatus(flags: BookingFlag[]): BookingStatus {
  if (flags.some((f) => f.severity === "critical")) return "critical";
  if (flags.some((f) => f.severity === "warning")) return "warning";
  return "clean";
}

/** Group journal entry lines by document_id */
function groupByDocument(
  lines: JournalEntryLine[],
): Map<string, JournalEntryLine[]> {
  const groups = new Map<string, JournalEntryLine[]>();
  for (const line of lines) {
    const docLines = groups.get(line.document_id) ?? [];
    docLines.push(line);
    groups.set(line.document_id, docLines);
  }
  return groups;
}

/** Transform raw journal entries into BookingDetail[] */
function transformAndFlag(rawLines: JournalEntryLine[]): BookingDetail[] {
  const textFlagMap = detectTextAnomalies(rawLines);
  const dupFlagMap = detectDuplicateBookings(rawLines);
  const unusualAmountMap = detectUnusualAmounts(rawLines);
  const roundNumberMap = detectRoundNumberAnomalies(rawLines);
  const patternBreakMap = detectPatternBreaks(rawLines);
  const missingCounterpartMap = detectMissingCounterparts(rawLines);

  // Merge all flag maps
  const flagMap = new Map<string, BookingFlag[]>();
  const allMaps = [
    textFlagMap,
    dupFlagMap,
    unusualAmountMap,
    roundNumberMap,
    patternBreakMap,
    missingCounterpartMap,
  ];
  for (const map of allMaps) {
    for (const [key, flags] of map) {
      flagMap.set(key, [...(flagMap.get(key) ?? []), ...flags]);
    }
  }
  const documents = groupByDocument(rawLines);
  const bookings: BookingDetail[] = [];

  for (const [documentId, docLines] of documents) {
    // Sort lines by line_id
    const sorted = [...docLines].sort((a, b) => a.line_id - b.line_id);
    const primary = sorted[0];

    // Collect all flags for all lines in this document
    const docFlags: BookingFlag[] = [];
    for (const line of sorted) {
      const lineFlags = flagMap.get(`${documentId}:${line.line_id}`) ?? [];
      docFlags.push(...lineFlags);
    }

    // Deduplicate flags by type+relatedDocumentId
    const uniqueFlags: BookingFlag[] = [];
    const seen = new Set<string>();
    for (const flag of docFlags) {
      const key = `${flag.type}:${flag.relatedDocumentId ?? ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueFlags.push(flag);
      }
    }

    // Find contra account (first line on opposite side from primary)
    const contraLine = sorted.find(
      (l) => l.debit_credit !== primary.debit_credit,
    );

    // Build document lines
    const documentLines: DocumentLine[] = sorted.map((l) => ({
      lineId: l.line_id,
      glAccount: l.gl_account,
      glAccountName: lookupAccountName(l.gl_account),
      amount: l.amount,
      debitCredit: l.debit_credit,
      costCenter: l.cost_center,
    }));

    // Signed amount: positive for debit, negative for credit
    const signedAmount =
      primary.debit_credit === "S" ? primary.amount : -primary.amount;

    bookings.push({
      documentId,
      postingDate: primary.posting_date,
      description: [...new Set(docLines.map((l) => l.booking_text))].join(
        " · ",
      ),
      glAccount: primary.gl_account,
      glAccountName: lookupAccountName(primary.gl_account),
      contraAccount: contraLine?.gl_account ?? null,
      contraAccountName: contraLine
        ? lookupAccountName(contraLine.gl_account)
        : null,
      amount: signedAmount,
      currency: primary.currency,
      status: deriveStatus(uniqueFlags),
      flags: uniqueFlags,
      documentType: primary.document_type,
      lineId: primary.line_id,
      companyCode: primary.company_code,
      costCenter: primary.cost_center,
      costCenterName: lookupCostCenterName(primary.cost_center),
      bookingText: primary.booking_text,
      vendorId: primary.vendor_id,
      customerId: primary.customer_id,
      taxCode: primary.tax_code,
      debitCredit: primary.debit_credit,
      documentLines,
    });
  }

  // Sort by posting date descending then document_id
  bookings.sort((a, b) => {
    const dateCompare = b.postingDate.localeCompare(a.postingDate);
    if (dateCompare !== 0) return dateCompare;
    return b.documentId.localeCompare(a.documentId);
  });

  return bookings;
}

// Module-level cache: transform once at import time
const allBookings = transformAndFlag(journalEntries as JournalEntryLine[]);
const bookingManual: BookingManual = mineBookingRules(
  journalEntries as JournalEntryLine[],
);

export const localBookingService: BookingService = {
  async getDashboardSummary() {
    return buildDashboardSummary(allBookings);
  },
  async getBookings(filters) {
    return queryBookings(allBookings, filters);
  },
  async getBookingDetail(documentId) {
    return (
      (allBookings.find((b) => b.documentId === documentId) as
        | BookingDetail
        | undefined) ?? null
    );
  },
  async getRelatedContext(documentId) {
    return findRelated(allBookings, documentId);
  },
  async getBookingManual() {
    return bookingManual;
  },
  async getRuleViolations(ruleId) {
    const rule = bookingManual.rules.find((r) => r.id === ruleId);
    if (!rule) return null;

    const rawLines = journalEntries as JournalEntryLine[];
    const violations = findRuleViolations(rule, rawLines, allBookings);
    return { rule, violations };
  },
};
