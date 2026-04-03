import type { JournalEntryLine } from "@/lib/data/journal-entry.types";
import type { BookingListItem } from "./booking.types";
import type { BookingRule } from "./rule.types";
import { ACCOUNT_RANGES } from "@/lib/data/account-master";
import { normalizeForComparison } from "./text-anomaly-detector";

function lookupAccountRange(glAccount: string): string | null {
  const range = ACCOUNT_RANGES.find(
    (r) => glAccount >= r.from && glAccount <= r.to,
  );
  return range?.category ?? null;
}

/**
 * Find all bookings that violate a given rule.
 *
 * Iterates raw journal entry lines to check rule-specific conditions,
 * collects violating document IDs, then returns matching BookingListItems.
 */
export function findRuleViolations(
  rule: BookingRule,
  lines: JournalEntryLine[],
  bookings: BookingListItem[],
): BookingListItem[] {
  const violatingDocIds = new Set<string>();

  switch (rule.category) {
    case "account_tax_code": {
      const { glAccount, taxCode } = rule.scope;
      for (const line of lines) {
        if (
          line.gl_account === glAccount &&
          line.tax_code !== null &&
          line.tax_code !== taxCode
        ) {
          violatingDocIds.add(line.document_id);
        }
      }
      break;
    }

    case "account_cost_center": {
      const { glAccount, costCenter } = rule.scope;
      for (const line of lines) {
        if (line.gl_account === glAccount && line.cost_center !== costCenter) {
          violatingDocIds.add(line.document_id);
        }
      }
      break;
    }

    case "document_type_account": {
      const { documentType } = rule.scope;
      // Determine the dominant account range from the rule's evidence/title
      // The rule title contains the range name, but we can re-derive it:
      // find the dominant range by counting debit-side lines for this doc type
      const debitLines = lines.filter(
        (l) => l.document_type === documentType && l.debit_credit === "S",
      );
      const rangeCounts = new Map<string, number>();
      for (const line of debitLines) {
        const range = lookupAccountRange(line.gl_account);
        if (!range) continue;
        rangeCounts.set(range, (rangeCounts.get(range) ?? 0) + 1);
      }
      let dominantRange = "";
      let dominantCount = 0;
      for (const [range, count] of rangeCounts) {
        if (count > dominantCount) {
          dominantRange = range;
          dominantCount = count;
        }
      }

      // Find documents where the debit-side account is NOT in the dominant range
      const docDebitRanges = new Map<string, Set<string>>();
      for (const line of lines) {
        if (line.document_type !== documentType || line.debit_credit !== "S")
          continue;
        const range = lookupAccountRange(line.gl_account);
        if (!range) continue;
        const ranges = docDebitRanges.get(line.document_id) ?? new Set();
        ranges.add(range);
        docDebitRanges.set(line.document_id, ranges);
      }
      for (const [docId, ranges] of docDebitRanges) {
        if (!ranges.has(dominantRange)) {
          violatingDocIds.add(docId);
        }
      }
      break;
    }

    case "recurring_text": {
      const { textPattern, glAccount } = rule.scope;
      for (const line of lines) {
        const normalized = normalizeForComparison(line.booking_text);
        if (normalized === textPattern && line.gl_account !== glAccount) {
          violatingDocIds.add(line.document_id);
        }
      }
      break;
    }

    case "amount_range": {
      const { glAccount, amountMin, amountMax } = rule.scope;
      for (const line of lines) {
        if (line.gl_account !== glAccount) continue;
        if (
          amountMin !== undefined &&
          amountMax !== undefined &&
          (line.amount < amountMin || line.amount > amountMax)
        ) {
          violatingDocIds.add(line.document_id);
        }
      }
      break;
    }

    default:
      return [];
  }

  return bookings.filter((b) => violatingDocIds.has(b.documentId));
}
