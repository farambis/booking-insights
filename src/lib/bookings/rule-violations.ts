import type { JournalEntryLine } from "@/lib/data/journal-entry.types";
import type { BookingListItem } from "./booking.types";
import type { BookingRule } from "./rule.types";
import { lookupAccountRange } from "@/lib/data/account-master";
import { normalizeForComparison } from "./text-anomaly-detector";

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

  switch (rule.scope.category) {
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
        if (
          line.gl_account === glAccount &&
          line.cost_center !== null &&
          line.cost_center !== costCenter
        ) {
          violatingDocIds.add(line.document_id);
        }
      }
      break;
    }

    case "document_type_account": {
      const { documentType, accountRange } = rule.scope;
      if (!accountRange) break;

      // Find documents where the debit-side account is NOT in the expected range
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
        if (!ranges.has(accountRange)) {
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
