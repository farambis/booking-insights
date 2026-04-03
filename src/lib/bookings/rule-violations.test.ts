import { describe, expect, it } from "vitest";
import type { JournalEntryLine } from "@/lib/data/journal-entry.types";
import type { BookingRule, RuleCategory } from "./rule.types";
import type { BookingListItem } from "./booking.types";
import { findRuleViolations } from "./rule-violations";

/** Helper to create a minimal JournalEntryLine for testing */
function makeLine(
  overrides: Partial<JournalEntryLine> & {
    document_id: string;
    line_id: number;
  },
): JournalEntryLine {
  return {
    company_code: "1000",
    posting_date: "2025-01-15",
    gl_account: "070000",
    cost_center: null,
    amount: 100,
    currency: "EUR",
    debit_credit: "S",
    booking_text: "Test Booking",
    vendor_id: null,
    customer_id: null,
    tax_code: null,
    document_type: "KR",
    ...overrides,
  };
}

function makeBookingListItem(
  overrides: Partial<BookingListItem> & { documentId: string },
): BookingListItem {
  return {
    postingDate: "2025-01-15",
    description: "Test Booking",
    glAccount: "070000",
    glAccountName: null,
    contraAccount: null,
    contraAccountName: null,
    amount: 100,
    currency: "EUR",
    status: "clean",
    flags: [],
    documentType: "KR",
    ...overrides,
  };
}

function makeRule(overrides: Partial<BookingRule>): BookingRule {
  return {
    id: "account_tax_code:070000:V19",
    title: "Account 070000 uses tax code V19",
    description: "Test rule",
    category: "account_tax_code",
    confidence: 0.9,
    supportCount: 9,
    totalEvaluated: 10,
    supportRatio: 0.9,
    evidence: [],
    violationCount: 1,
    scope: {
      category: "account_tax_code",
      glAccount: "070000",
      taxCode: "V19",
    },
    ...overrides,
  };
}

describe("findRuleViolations", () => {
  describe("account_tax_code", () => {
    it("returns lines on the scoped account where tax_code differs", () => {
      const rule = makeRule({
        id: "account_tax_code:070000:V19",
        category: "account_tax_code",
        scope: {
          category: "account_tax_code",
          glAccount: "070000",
          taxCode: "V19",
        },
      });

      const lines: JournalEntryLine[] = [
        makeLine({
          document_id: "D1",
          line_id: 1,
          gl_account: "070000",
          tax_code: "V19",
        }),
        makeLine({
          document_id: "D2",
          line_id: 1,
          gl_account: "070000",
          tax_code: "V7",
        }),
        makeLine({
          document_id: "D3",
          line_id: 1,
          gl_account: "060000",
          tax_code: "V7",
        }),
      ];

      const bookings: BookingListItem[] = [
        makeBookingListItem({ documentId: "D1", glAccount: "070000" }),
        makeBookingListItem({ documentId: "D2", glAccount: "070000" }),
        makeBookingListItem({ documentId: "D3", glAccount: "060000" }),
      ];

      const result = findRuleViolations(rule, lines, bookings);
      expect(result.length).toBe(1);
      expect(result[0].documentId).toBe("D2");
    });

    it("does not flag lines where tax_code is null", () => {
      const rule = makeRule({
        category: "account_tax_code",
        scope: {
          category: "account_tax_code",
          glAccount: "070000",
          taxCode: "V19",
        },
      });

      const lines: JournalEntryLine[] = [
        makeLine({
          document_id: "D1",
          line_id: 1,
          gl_account: "070000",
          tax_code: "V19",
        }),
        makeLine({
          document_id: "D2",
          line_id: 1,
          gl_account: "070000",
          tax_code: null,
        }),
      ];

      const bookings: BookingListItem[] = [
        makeBookingListItem({ documentId: "D1", glAccount: "070000" }),
        makeBookingListItem({ documentId: "D2", glAccount: "070000" }),
      ];

      const result = findRuleViolations(rule, lines, bookings);
      expect(result.length).toBe(0);
    });

    it("returns empty array when all lines conform", () => {
      const rule = makeRule({
        category: "account_tax_code",
        scope: {
          category: "account_tax_code",
          glAccount: "070000",
          taxCode: "V19",
        },
      });

      const lines: JournalEntryLine[] = [
        makeLine({
          document_id: "D1",
          line_id: 1,
          gl_account: "070000",
          tax_code: "V19",
        }),
      ];

      const bookings: BookingListItem[] = [
        makeBookingListItem({ documentId: "D1", glAccount: "070000" }),
      ];

      const result = findRuleViolations(rule, lines, bookings);
      expect(result.length).toBe(0);
    });
  });

  describe("account_cost_center", () => {
    it("returns lines on the scoped account where cost_center differs", () => {
      const rule = makeRule({
        id: "account_cost_center:060000:1000",
        category: "account_cost_center",
        scope: {
          category: "account_cost_center",
          glAccount: "060000",
          costCenter: "1000",
        },
      });

      const lines: JournalEntryLine[] = [
        makeLine({
          document_id: "D1",
          line_id: 1,
          gl_account: "060000",
          cost_center: "1000",
        }),
        makeLine({
          document_id: "D2",
          line_id: 1,
          gl_account: "060000",
          cost_center: "2000",
        }),
      ];

      const bookings: BookingListItem[] = [
        makeBookingListItem({ documentId: "D1", glAccount: "060000" }),
        makeBookingListItem({ documentId: "D2", glAccount: "060000" }),
      ];

      const result = findRuleViolations(rule, lines, bookings);
      expect(result.length).toBe(1);
      expect(result[0].documentId).toBe("D2");
    });

    it("does not flag lines where cost_center is null", () => {
      const rule = makeRule({
        id: "account_cost_center:060000:1000",
        category: "account_cost_center",
        scope: {
          category: "account_cost_center",
          glAccount: "060000",
          costCenter: "1000",
        },
      });

      const lines: JournalEntryLine[] = [
        makeLine({
          document_id: "D1",
          line_id: 1,
          gl_account: "060000",
          cost_center: "1000",
        }),
        makeLine({
          document_id: "D2",
          line_id: 1,
          gl_account: "060000",
          cost_center: null,
        }),
      ];

      const bookings: BookingListItem[] = [
        makeBookingListItem({ documentId: "D1", glAccount: "060000" }),
        makeBookingListItem({ documentId: "D2", glAccount: "060000" }),
      ];

      const result = findRuleViolations(rule, lines, bookings);
      expect(result.length).toBe(0);
    });
  });

  describe("document_type_account", () => {
    it("returns documents with the scoped document type where debit-side account is outside expected range", () => {
      const rule = makeRule({
        id: "document_type_account:KR",
        category: "document_type_account",
        scope: {
          category: "document_type_account",
          documentType: "KR",
          accountRange: "Operating expenses",
        },
      });

      // D1: KR with debit on 070000 (Operating expenses) - need to know dominant range
      // D2: KR with debit on 040000 (Revenue) - violation if Operating expenses is dominant
      // D3: SA - different doc type, not relevant
      const lines: JournalEntryLine[] = [
        makeLine({
          document_id: "D1",
          line_id: 1,
          document_type: "KR",
          gl_account: "070000",
          debit_credit: "S",
        }),
        makeLine({
          document_id: "D1",
          line_id: 2,
          document_type: "KR",
          gl_account: "030000",
          debit_credit: "H",
        }),
        makeLine({
          document_id: "D2",
          line_id: 1,
          document_type: "KR",
          gl_account: "040000",
          debit_credit: "S",
        }),
        makeLine({
          document_id: "D2",
          line_id: 2,
          document_type: "KR",
          gl_account: "030000",
          debit_credit: "H",
        }),
        makeLine({
          document_id: "D3",
          line_id: 1,
          document_type: "SA",
          gl_account: "040000",
          debit_credit: "S",
        }),
      ];

      const bookings: BookingListItem[] = [
        makeBookingListItem({ documentId: "D1", documentType: "KR" }),
        makeBookingListItem({ documentId: "D2", documentType: "KR" }),
        makeBookingListItem({ documentId: "D3", documentType: "SA" }),
      ];

      const result = findRuleViolations(rule, lines, bookings);
      // D2 has KR with debit on Revenue (040000), not Operating expenses
      expect(result.length).toBe(1);
      expect(result[0].documentId).toBe("D2");
    });
  });

  describe("recurring_text", () => {
    it("returns lines matching the text pattern where gl_account differs", () => {
      const rule = makeRule({
        id: "recurring_text:Miete:070000",
        category: "recurring_text",
        scope: {
          category: "recurring_text",
          textPattern: "Miete",
          glAccount: "070000",
        },
      });

      const lines: JournalEntryLine[] = [
        makeLine({
          document_id: "D1",
          line_id: 1,
          booking_text: "Miete",
          gl_account: "070000",
        }),
        makeLine({
          document_id: "D2",
          line_id: 1,
          booking_text: "Miete",
          gl_account: "060000",
        }),
        makeLine({
          document_id: "D3",
          line_id: 1,
          booking_text: "Gehalt",
          gl_account: "060000",
        }),
      ];

      const bookings: BookingListItem[] = [
        makeBookingListItem({ documentId: "D1", glAccount: "070000" }),
        makeBookingListItem({ documentId: "D2", glAccount: "060000" }),
        makeBookingListItem({ documentId: "D3", glAccount: "060000" }),
      ];

      const result = findRuleViolations(rule, lines, bookings);
      expect(result.length).toBe(1);
      expect(result[0].documentId).toBe("D2");
    });
  });

  describe("amount_range", () => {
    it("returns lines on the scoped account where amount is outside range", () => {
      const rule = makeRule({
        id: "amount_range:070000",
        category: "amount_range",
        scope: {
          category: "amount_range",
          glAccount: "070000",
          amountMin: 90,
          amountMax: 110,
        },
      });

      const lines: JournalEntryLine[] = [
        makeLine({
          document_id: "D1",
          line_id: 1,
          gl_account: "070000",
          amount: 100,
        }),
        makeLine({
          document_id: "D2",
          line_id: 1,
          gl_account: "070000",
          amount: 200,
        }),
        makeLine({
          document_id: "D3",
          line_id: 1,
          gl_account: "070000",
          amount: 50,
        }),
        makeLine({
          document_id: "D4",
          line_id: 1,
          gl_account: "060000",
          amount: 200,
        }),
      ];

      const bookings: BookingListItem[] = [
        makeBookingListItem({ documentId: "D1", glAccount: "070000" }),
        makeBookingListItem({ documentId: "D2", glAccount: "070000" }),
        makeBookingListItem({ documentId: "D3", glAccount: "070000" }),
        makeBookingListItem({ documentId: "D4", glAccount: "060000" }),
      ];

      const result = findRuleViolations(rule, lines, bookings);
      expect(result.length).toBe(2);
      const ids = result.map((r) => r.documentId).sort();
      expect(ids).toEqual(["D2", "D3"]);
    });
  });

  it("returns empty array for unknown category", () => {
    const rule = makeRule({
      category: "unknown_category" as RuleCategory,
    });

    const result = findRuleViolations(rule, [], []);
    expect(result.length).toBe(0);
  });
});
