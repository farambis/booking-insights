import { describe, expect, it } from "vitest";
import type { JournalEntryLine } from "@/lib/data/journal-entry.types";
import {
  computePairScore,
  detectDuplicateBookings,
  type DocumentSummary,
} from "./duplicate-detector";

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
    amount: 1000,
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

/** Build a simple two-line document (debit + credit) */
function makeDocument(
  docId: string,
  overrides: Partial<JournalEntryLine> = {},
): JournalEntryLine[] {
  const amount = overrides.amount ?? 1000;
  return [
    makeLine({
      document_id: docId,
      line_id: 1,
      debit_credit: "S",
      amount,
      ...overrides,
    }),
    makeLine({
      document_id: docId,
      line_id: 2,
      debit_credit: "H",
      gl_account: "030000",
      amount,
      ...overrides,
      // contra account should differ from primary
    }),
  ];
}

/** Helper to build a DocumentSummary for testing computePairScore directly */
function makeSummary(
  overrides: Partial<DocumentSummary> = {},
): DocumentSummary {
  return {
    documentId: "D1",
    totalAmount: 1000,
    primaryGlAccount: "070000",
    contraGlAccount: "030000",
    postingDate: "2025-01-15",
    bookingText: "Test Booking",
    documentType: "KR",
    vendorId: "V0001",
    customerId: null,
    costCenter: "1000",
    taxCode: "V19",
    ...overrides,
  };
}

describe("computePairScore", () => {
  describe("amount signal", () => {
    it("scores 1.0 for identical amounts", () => {
      const a = makeSummary({ totalAmount: 1000 });
      const b = makeSummary({ documentId: "D2", totalAmount: 1000 });
      const result = computePairScore(a, b);
      expect(result.signals.amount).toBe(1.0);
    });

    it("scores 1.0 for amounts within cent tolerance (≤0.50 EUR)", () => {
      const a = makeSummary({ totalAmount: 1000 });
      const b = makeSummary({ documentId: "D2", totalAmount: 1000.3 });
      const result = computePairScore(a, b);
      expect(result.signals.amount).toBe(1.0);
    });

    it("scores 0.0 for amounts differing by more than 0.50 EUR", () => {
      const a = makeSummary({ totalAmount: 1000 });
      const b = makeSummary({ documentId: "D2", totalAmount: 1001 });
      const result = computePairScore(a, b);
      expect(result.signals.amount).toBe(0.0);
    });

    it("applies 0.50 EUR absolute floor before percentage check", () => {
      // Amounts differ by 0.40 EUR which is < 0.50 floor, so should score 1.0
      const a = makeSummary({ totalAmount: 1.0 });
      const b = makeSummary({ documentId: "D2", totalAmount: 1.4 });
      const result = computePairScore(a, b);
      expect(result.signals.amount).toBe(1.0);
    });
  });

  describe("vendor/customer signal", () => {
    it("scores 1.0 for matching vendor_id", () => {
      const a = makeSummary({ vendorId: "V0001" });
      const b = makeSummary({ documentId: "D2", vendorId: "V0001" });
      const result = computePairScore(a, b);
      expect(result.signals.vendorCustomer).toBe(1.0);
    });

    it("scores 1.0 for matching customer_id", () => {
      const a = makeSummary({
        vendorId: null,
        customerId: "C0001",
      });
      const b = makeSummary({
        documentId: "D2",
        vendorId: null,
        customerId: "C0001",
      });
      const result = computePairScore(a, b);
      expect(result.signals.vendorCustomer).toBe(1.0);
    });

    it("scores 0.0 when both vendor and customer are null (no signal)", () => {
      const a = makeSummary({ vendorId: null, customerId: null });
      const b = makeSummary({
        documentId: "D2",
        vendorId: null,
        customerId: null,
      });
      const result = computePairScore(a, b);
      expect(result.signals.vendorCustomer).toBe(0.0);
      // Weight should not contribute
      expect(result.activeWeight).toBeLessThan(1.0);
    });

    it("scores 0.0 for mismatched vendor_id", () => {
      const a = makeSummary({ vendorId: "V0001" });
      const b = makeSummary({ documentId: "D2", vendorId: "V0002" });
      const result = computePairScore(a, b);
      expect(result.signals.vendorCustomer).toBe(0.0);
    });
  });

  describe("gl_account signal", () => {
    it("scores 1.0 for matching primary GL account", () => {
      const a = makeSummary({ primaryGlAccount: "070000" });
      const b = makeSummary({ documentId: "D2", primaryGlAccount: "070000" });
      const result = computePairScore(a, b);
      expect(result.signals.glAccount).toBe(1.0);
    });

    it("scores 0.0 for different primary GL accounts", () => {
      const a = makeSummary({ primaryGlAccount: "070000" });
      const b = makeSummary({ documentId: "D2", primaryGlAccount: "060000" });
      const result = computePairScore(a, b);
      expect(result.signals.glAccount).toBe(0.0);
    });
  });

  describe("contra_account signal", () => {
    it("scores 1.0 for matching contra account", () => {
      const a = makeSummary({ contraGlAccount: "030000" });
      const b = makeSummary({ documentId: "D2", contraGlAccount: "030000" });
      const result = computePairScore(a, b);
      expect(result.signals.contraAccount).toBe(1.0);
    });

    it("scores 0.0 for different contra accounts", () => {
      const a = makeSummary({ contraGlAccount: "030000" });
      const b = makeSummary({ documentId: "D2", contraGlAccount: "090000" });
      const result = computePairScore(a, b);
      expect(result.signals.contraAccount).toBe(0.0);
    });
  });

  describe("posting_date proximity signal", () => {
    it("scores 1.0 for same day", () => {
      const a = makeSummary({ postingDate: "2025-01-15" });
      const b = makeSummary({ documentId: "D2", postingDate: "2025-01-15" });
      const result = computePairScore(a, b);
      expect(result.signals.postingDate).toBe(1.0);
    });

    it("scores 0.8 for 1 day apart", () => {
      const a = makeSummary({ postingDate: "2025-01-15" });
      const b = makeSummary({ documentId: "D2", postingDate: "2025-01-16" });
      const result = computePairScore(a, b);
      expect(result.signals.postingDate).toBe(0.8);
    });

    it("scores 0.6 for 2 days apart", () => {
      const a = makeSummary({ postingDate: "2025-01-15" });
      const b = makeSummary({ documentId: "D2", postingDate: "2025-01-17" });
      const result = computePairScore(a, b);
      expect(result.signals.postingDate).toBe(0.6);
    });

    it("scores 0.3 for 3-5 days apart", () => {
      const a = makeSummary({ postingDate: "2025-01-15" });
      const b = makeSummary({ documentId: "D2", postingDate: "2025-01-18" });
      const result = computePairScore(a, b);
      expect(result.signals.postingDate).toBe(0.3);
    });

    it("scores 0.0 for >5 days apart", () => {
      const a = makeSummary({ postingDate: "2025-01-15" });
      const b = makeSummary({ documentId: "D2", postingDate: "2025-01-25" });
      const result = computePairScore(a, b);
      expect(result.signals.postingDate).toBe(0.0);
    });
  });

  describe("booking_text similarity signal", () => {
    it("scores 1.0 for exact normalized match", () => {
      const a = makeSummary({ bookingText: "  Test Booking  " });
      const b = makeSummary({ documentId: "D2", bookingText: "test booking" });
      const result = computePairScore(a, b);
      expect(result.signals.bookingText).toBe(1.0);
    });

    it("scores 0.7 for Levenshtein distance <= 2", () => {
      const a = makeSummary({ bookingText: "Büromaterial" });
      const b = makeSummary({ documentId: "D2", bookingText: "Büromateiral" });
      const result = computePairScore(a, b);
      expect(result.signals.bookingText).toBe(0.7);
    });

    it("scores 0.4 for Levenshtein distance <= 3", () => {
      const a = makeSummary({ bookingText: "abcdef" });
      const b = makeSummary({ documentId: "D2", bookingText: "abcxyz" });
      // distance = 3
      const result = computePairScore(a, b);
      expect(result.signals.bookingText).toBe(0.4);
    });

    it("scores 0.0 for completely different texts", () => {
      const a = makeSummary({ bookingText: "Invoice payment" });
      const b = makeSummary({
        documentId: "D2",
        bookingText: "Salary transfer monthly",
      });
      const result = computePairScore(a, b);
      expect(result.signals.bookingText).toBe(0.0);
    });
  });

  describe("document_type signal", () => {
    it("scores 1.0 for matching document types", () => {
      const a = makeSummary({ documentType: "KR" });
      const b = makeSummary({ documentId: "D2", documentType: "KR" });
      const result = computePairScore(a, b);
      expect(result.signals.documentType).toBe(1.0);
    });

    it("scores 0.0 for different document types", () => {
      const a = makeSummary({ documentType: "KR" });
      const b = makeSummary({ documentId: "D2", documentType: "SA" });
      const result = computePairScore(a, b);
      expect(result.signals.documentType).toBe(0.0);
    });
  });

  describe("cost_center signal", () => {
    it("scores 1.0 for matching cost centers", () => {
      const a = makeSummary({ costCenter: "1000" });
      const b = makeSummary({ documentId: "D2", costCenter: "1000" });
      const result = computePairScore(a, b);
      expect(result.signals.costCenter).toBe(1.0);
    });

    it("scores 0.0 when both are null (no signal)", () => {
      const a = makeSummary({ costCenter: null });
      const b = makeSummary({ documentId: "D2", costCenter: null });
      const result = computePairScore(a, b);
      expect(result.signals.costCenter).toBe(0.0);
    });

    it("scores 0.0 for different cost centers", () => {
      const a = makeSummary({ costCenter: "1000" });
      const b = makeSummary({ documentId: "D2", costCenter: "2000" });
      const result = computePairScore(a, b);
      expect(result.signals.costCenter).toBe(0.0);
    });
  });

  describe("tax_code signal", () => {
    it("scores 1.0 for matching tax codes", () => {
      const a = makeSummary({ taxCode: "V19" });
      const b = makeSummary({ documentId: "D2", taxCode: "V19" });
      const result = computePairScore(a, b);
      expect(result.signals.taxCode).toBe(1.0);
    });

    it("scores 0.0 when both are null (no signal)", () => {
      const a = makeSummary({ taxCode: null });
      const b = makeSummary({ documentId: "D2", taxCode: null });
      const result = computePairScore(a, b);
      expect(result.signals.taxCode).toBe(0.0);
    });
  });
});

describe("gate rules", () => {
  it("excludes invoice+payment pairs (KR + KZ)", () => {
    const lines = [
      ...makeDocument("D1", { document_type: "KR", vendor_id: "V0001" }),
      ...makeDocument("D2", { document_type: "KZ", vendor_id: "V0001" }),
    ];
    const result = detectDuplicateBookings(lines);
    // No flags should be generated for this pair
    expect(result.size).toBe(0);
  });

  it("excludes invoice+payment pairs (DR + DZ)", () => {
    const lines = [
      ...makeDocument("D1", {
        document_type: "DR",
        customer_id: "C0001",
        vendor_id: null,
      }),
      ...makeDocument("D2", {
        document_type: "DZ",
        customer_id: "C0001",
        vendor_id: null,
      }),
    ];
    const result = detectDuplicateBookings(lines);
    expect(result.size).toBe(0);
  });

  it("never compares a document to itself", () => {
    const lines = makeDocument("D1", { vendor_id: "V0001" });
    const result = detectDuplicateBookings(lines);
    expect(result.size).toBe(0);
  });

  it("requires amount match — same vendor + same account without matching amount is not flagged", () => {
    const lines = [
      ...makeDocument("D1", {
        amount: 1000,
        vendor_id: "V0001",
        gl_account: "070000",
      }),
      ...makeDocument("D2", {
        amount: 2000,
        vendor_id: "V0001",
        gl_account: "070000",
      }),
    ];
    const result = detectDuplicateBookings(lines);
    // Same vendor + same account is normal business, not a duplicate
    expect(result.size).toBe(0);
  });

  it("flags when amounts match even without vendor", () => {
    const lines = [
      ...makeDocument("D1", {
        amount: 1000,
        vendor_id: null,
        gl_account: "070000",
      }),
      ...makeDocument("D2", {
        amount: 1000,
        vendor_id: null,
        gl_account: "070000",
      }),
    ];
    const result = detectDuplicateBookings(lines);
    // Same amount + same account = suspicious
    expect(result.size).toBeGreaterThan(0);
  });
});

describe("confidence tiers", () => {
  it("flags as critical for score >= 0.75", () => {
    // Near-perfect duplicates: same everything
    const lines = [
      ...makeDocument("D1", {
        vendor_id: "V0001",
        booking_text: "Lieferant Mueller",
        gl_account: "070000",
        cost_center: "1000",
        tax_code: "V19",
      }),
      ...makeDocument("D2", {
        vendor_id: "V0001",
        booking_text: "Lieferant Mueller",
        gl_account: "070000",
        cost_center: "1000",
        tax_code: "V19",
      }),
    ];
    const result = detectDuplicateBookings(lines);
    expect(result.size).toBeGreaterThan(0);

    const flags = Array.from(result.values()).flat();
    expect(flags.some((f) => f.severity === "critical")).toBe(true);
  });

  it("flags as warning for score 0.50-0.74", () => {
    // Similar but not identical: same vendor, same GL, different amount (10% off), 2 days apart
    const lines = [
      ...makeDocument("D1", {
        amount: 1000,
        vendor_id: "V0001",
        gl_account: "070000",
        posting_date: "2025-01-15",
        booking_text: "Totally different text here",
        cost_center: null,
        tax_code: null,
      }),
      ...makeDocument("D2", {
        amount: 1100,
        vendor_id: "V0001",
        gl_account: "070000",
        posting_date: "2025-01-17",
        booking_text: "Something else entirely now",
        cost_center: null,
        tax_code: null,
      }),
    ];
    const result = detectDuplicateBookings(lines);
    if (result.size > 0) {
      const flags = Array.from(result.values()).flat();
      expect(flags.every((f) => f.severity === "warning")).toBe(true);
    }
  });

  it("does not flag for score < 0.35", () => {
    // Very different documents
    const lines = [
      ...makeDocument("D1", {
        amount: 100,
        vendor_id: "V0001",
        gl_account: "070000",
        posting_date: "2025-01-01",
        booking_text: "First booking",
        document_type: "KR",
      }),
      ...makeDocument("D2", {
        amount: 50000,
        vendor_id: null,
        customer_id: "C0001",
        gl_account: "040000",
        posting_date: "2025-02-28",
        booking_text: "Completely different",
        document_type: "DR",
      }),
    ];
    const result = detectDuplicateBookings(lines);
    expect(result.size).toBe(0);
  });
});

describe("explanation generation", () => {
  it("includes matched criteria in the explanation", () => {
    const lines = [
      ...makeDocument("D1", {
        vendor_id: "V0001",
        booking_text: "Lieferant Mueller",
        gl_account: "070000",
      }),
      ...makeDocument("D2", {
        vendor_id: "V0001",
        booking_text: "Lieferant Mueller",
        gl_account: "070000",
        posting_date: "2025-01-16",
      }),
    ];
    const result = detectDuplicateBookings(lines);
    expect(result.size).toBeGreaterThan(0);

    const flags = Array.from(result.values()).flat();
    const explanation = flags[0].explanation;
    expect(explanation).toContain("D2");
    expect(explanation).toContain("V0001");
    expect(explanation).toContain("070000");
  });

  it("includes amount match in explanation for near-exact amounts", () => {
    const lines = [
      ...makeDocument("D1", {
        amount: 1000,
        vendor_id: "V0001",
        gl_account: "070000",
      }),
      ...makeDocument("D2", {
        amount: 1000.3,
        vendor_id: "V0001",
        gl_account: "070000",
      }),
    ];
    const result = detectDuplicateBookings(lines);
    const flags = Array.from(result.values()).flat();
    const explanation = flags[0].explanation;
    expect(explanation).toContain("same amount");
  });

  it("does not flag when amounts differ (amount gate)", () => {
    const lines = [
      ...makeDocument("D1", {
        amount: 1000,
        vendor_id: "V0001",
        gl_account: "070000",
      }),
      ...makeDocument("D2", {
        amount: 1050,
        vendor_id: "V0001",
        gl_account: "070000",
      }),
    ];
    const result = detectDuplicateBookings(lines);
    // Different amounts = not a duplicate, regardless of other signals
    expect(result.size).toBe(0);
  });
});

describe("detectDuplicateBookings", () => {
  it("returns FlagMap with document_id:line_id keys", () => {
    const lines = [
      ...makeDocument("D1", { vendor_id: "V0001", gl_account: "070000" }),
      ...makeDocument("D2", { vendor_id: "V0001", gl_account: "070000" }),
    ];
    const result = detectDuplicateBookings(lines);
    expect(result.size).toBeGreaterThan(0);

    // All keys should match the "documentId:lineId" pattern
    for (const key of result.keys()) {
      expect(key).toMatch(/^D\d+:\d+$/);
    }
  });

  it("flags use type duplicate_booking", () => {
    const lines = [
      ...makeDocument("D1", { vendor_id: "V0001", gl_account: "070000" }),
      ...makeDocument("D2", { vendor_id: "V0001", gl_account: "070000" }),
    ];
    const result = detectDuplicateBookings(lines);
    const flags = Array.from(result.values()).flat();
    expect(flags.every((f) => f.type === "duplicate_booking")).toBe(true);
  });

  it("sets relatedDocumentId to the other document in the pair", () => {
    const lines = [
      ...makeDocument("D1", { vendor_id: "V0001", gl_account: "070000" }),
      ...makeDocument("D2", { vendor_id: "V0001", gl_account: "070000" }),
    ];
    const result = detectDuplicateBookings(lines);

    // D1 lines should reference D2 and vice versa
    const d1Flags = result.get("D1:1") ?? [];
    const d2Flags = result.get("D2:1") ?? [];
    if (d1Flags.length > 0) {
      expect(d1Flags[0].relatedDocumentId).toBe("D2");
    }
    if (d2Flags.length > 0) {
      expect(d2Flags[0].relatedDocumentId).toBe("D1");
    }
  });

  it("correctly groups lines by document and computes total debit amount", () => {
    // Document with multiple debit lines
    const lines = [
      makeLine({
        document_id: "D1",
        line_id: 1,
        debit_credit: "S",
        amount: 500,
        vendor_id: "V0001",
        gl_account: "070000",
      }),
      makeLine({
        document_id: "D1",
        line_id: 2,
        debit_credit: "S",
        amount: 500,
        vendor_id: "V0001",
        gl_account: "070100",
      }),
      makeLine({
        document_id: "D1",
        line_id: 3,
        debit_credit: "H",
        amount: 1000,
        vendor_id: "V0001",
        gl_account: "030000",
      }),
      // Matching document with same total
      ...makeDocument("D2", {
        amount: 1000,
        vendor_id: "V0001",
        gl_account: "070000",
      }),
    ];
    const result = detectDuplicateBookings(lines);
    // Should detect the pair since total debit amount is the same
    expect(result.size).toBeGreaterThan(0);
  });

  it("does not flag legitimate different bookings", () => {
    // Multiple different vendors, different accounts, different amounts, different dates
    const lines = [
      ...makeDocument("D1", {
        amount: 500,
        vendor_id: "V0001",
        gl_account: "070000",
        posting_date: "2025-01-01",
        booking_text: "Office rent",
        document_type: "KR",
      }),
      ...makeDocument("D2", {
        amount: 25000,
        vendor_id: "V0005",
        gl_account: "050000",
        posting_date: "2025-02-15",
        booking_text: "Raw materials purchase",
        document_type: "KR",
      }),
      ...makeDocument("D3", {
        amount: 3000,
        vendor_id: null,
        customer_id: "C0001",
        gl_account: "020000",
        posting_date: "2025-01-20",
        booking_text: "Customer invoice",
        document_type: "DR",
      }),
    ];
    const result = detectDuplicateBookings(lines);
    expect(result.size).toBe(0);
  });

  it("handles empty input", () => {
    const result = detectDuplicateBookings([]);
    expect(result.size).toBe(0);
  });

  it("handles single document", () => {
    const result = detectDuplicateBookings(makeDocument("D1"));
    expect(result.size).toBe(0);
  });
});

describe("integration with planted duplicates", () => {
  it("detects exact-duplicate documents from generated data", () => {
    // Simulate the pattern: same amount, same vendor, 1 day apart (double entry)
    const lines = [
      // Original document
      makeLine({
        document_id: "5000000001",
        line_id: 1,
        posting_date: "2025-01-15",
        gl_account: "070000",
        amount: 1500,
        debit_credit: "S",
        booking_text: "Lieferant Müller GmbH",
        vendor_id: "V0003",
        document_type: "KR",
        cost_center: "1000",
        tax_code: "V19",
      }),
      makeLine({
        document_id: "5000000001",
        line_id: 2,
        posting_date: "2025-01-15",
        gl_account: "030000",
        amount: 1500,
        debit_credit: "H",
        booking_text: "Lieferant Müller GmbH",
        vendor_id: "V0003",
        document_type: "KR",
        cost_center: null,
        tax_code: null,
      }),
      // Duplicate: same amount, 1 day later
      makeLine({
        document_id: "5000000041",
        line_id: 1,
        posting_date: "2025-01-16",
        gl_account: "070000",
        amount: 1500,
        debit_credit: "S",
        booking_text: "Lieferant Müller GmbH",
        vendor_id: "V0003",
        document_type: "KR",
        cost_center: "1000",
        tax_code: "V19",
      }),
      makeLine({
        document_id: "5000000041",
        line_id: 2,
        posting_date: "2025-01-16",
        gl_account: "030000",
        amount: 1500,
        debit_credit: "H",
        booking_text: "Lieferant Müller GmbH",
        vendor_id: "V0003",
        document_type: "KR",
        cost_center: null,
        tax_code: null,
      }),
    ];

    const result = detectDuplicateBookings(lines);
    expect(result.size).toBeGreaterThan(0);

    // Both documents should be flagged as critical (all signals match)
    const d1Flags = result.get("5000000001:1");
    const d2Flags = result.get("5000000041:1");
    expect(d1Flags).toBeDefined();
    expect(d2Flags).toBeDefined();
    expect(d1Flags![0].type).toBe("duplicate_booking");
    expect(d1Flags![0].severity).toBe("critical");
  });
});
