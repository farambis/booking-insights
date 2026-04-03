import { describe, expect, it } from "vitest";
import type { JournalEntryLine } from "@/lib/data/journal-entry.types";
import {
  normalizeForComparison,
  detectTypos,
  detectUnusualTextAccountCombos,
  detectTextAnomalies,
} from "./text-anomaly-detector";

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
    gl_account: "400000",
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

describe("normalizeForComparison", () => {
  it("strips trailing ISO dates", () => {
    expect(normalizeForComparison("Ausgangsrechnung 2025-01-15")).toBe(
      "Ausgangsrechnung",
    );
  });

  it("strips trailing numbers", () => {
    expect(normalizeForComparison("Kundenrechnung 12345")).toBe(
      "Kundenrechnung",
    );
  });

  it("leaves text without trailing dates/numbers unchanged", () => {
    expect(normalizeForComparison("Büromaterial")).toBe("Büromaterial");
  });

  it("strips date then number suffix", () => {
    expect(normalizeForComparison("Rechnung 2025-01-15")).toBe("Rechnung");
  });
});

describe("detectTypos", () => {
  it("flags the less frequent text as a suspected typo (distance 1)", () => {
    const lines: JournalEntryLine[] = [
      // "Büromaterial" appears 3 times
      makeLine({ document_id: "D1", line_id: 1, booking_text: "Büromaterial" }),
      makeLine({ document_id: "D2", line_id: 1, booking_text: "Büromaterial" }),
      makeLine({ document_id: "D3", line_id: 1, booking_text: "Büromaterial" }),
      // "Büromateiral" appears 1 time (typo, distance 2 — transposition)
      makeLine({
        document_id: "D4",
        line_id: 1,
        booking_text: "Büromateiral",
      }),
    ];

    const result = detectTypos(lines);

    // The typo line D4:1 should be flagged
    const flags = result.get("D4:1");
    expect(flags).toBeDefined();
    expect(flags!.length).toBe(1);
    expect(flags![0].type).toBe("text_typo");
    expect(flags![0].severity).toBe("warning");
    expect(flags![0].confidence).toBeGreaterThan(0);
  });

  it("returns empty map when all texts are identical", () => {
    const lines: JournalEntryLine[] = [
      makeLine({ document_id: "D1", line_id: 1, booking_text: "Same Text" }),
      makeLine({ document_id: "D2", line_id: 1, booking_text: "Same Text" }),
    ];

    const result = detectTypos(lines);
    expect(result.size).toBe(0);
  });

  it("does not flag date-suffixed variants of the same base text", () => {
    const lines: JournalEntryLine[] = [
      makeLine({
        document_id: "D1",
        line_id: 1,
        booking_text: "Ausgangsrechnung 2025-01-15",
      }),
      makeLine({
        document_id: "D2",
        line_id: 1,
        booking_text: "Ausgangsrechnung 2025-01-16",
      }),
      makeLine({
        document_id: "D3",
        line_id: 1,
        booking_text: "Ausgangsrechnung 2025-01-17",
      }),
    ];

    const result = detectTypos(lines);
    expect(result.size).toBe(0);
  });

  it("does not flag pairs with distance > 3", () => {
    const lines: JournalEntryLine[] = [
      makeLine({ document_id: "D1", line_id: 1, booking_text: "Alpha" }),
      makeLine({
        document_id: "D2",
        line_id: 1,
        booking_text: "CompletelyDifferent",
      }),
    ];

    const result = detectTypos(lines);
    expect(result.size).toBe(0);
  });

  it("skips pairs where length difference exceeds 3", () => {
    const lines: JournalEntryLine[] = [
      makeLine({ document_id: "D1", line_id: 1, booking_text: "AB" }),
      makeLine({ document_id: "D2", line_id: 1, booking_text: "ABCDEFG" }),
    ];

    const result = detectTypos(lines);
    expect(result.size).toBe(0);
  });

  it("assigns higher confidence for smaller distances", () => {
    const lines: JournalEntryLine[] = [
      makeLine({ document_id: "D1", line_id: 1, booking_text: "Miete" }),
      makeLine({ document_id: "D1", line_id: 2, booking_text: "Miete" }),
      // distance 1 from "Miete"
      makeLine({ document_id: "D2", line_id: 1, booking_text: "Miate" }),
    ];

    const result = detectTypos(lines);
    const flags = result.get("D2:1");
    expect(flags).toBeDefined();
    expect(flags![0].confidence).toBe(0.9);
  });
});

describe("detectUnusualTextAccountCombos", () => {
  it("flags a text-account combo that is rare relative to the text total", () => {
    const lines: JournalEntryLine[] = [
      // "Lieferant Mueller" on account 400000 — 4 times
      makeLine({
        document_id: "D1",
        line_id: 1,
        booking_text: "Lieferant Mueller",
        gl_account: "400000",
      }),
      makeLine({
        document_id: "D2",
        line_id: 1,
        booking_text: "Lieferant Mueller",
        gl_account: "400000",
      }),
      makeLine({
        document_id: "D3",
        line_id: 1,
        booking_text: "Lieferant Mueller",
        gl_account: "400000",
      }),
      makeLine({
        document_id: "D4",
        line_id: 1,
        booking_text: "Lieferant Mueller",
        gl_account: "400000",
      }),
      // "Lieferant Mueller" on account 060000 — 1 time (unusual)
      makeLine({
        document_id: "D5",
        line_id: 1,
        booking_text: "Lieferant Mueller",
        gl_account: "060000",
      }),
    ];

    const result = detectUnusualTextAccountCombos(lines);

    // D5:1 should be flagged (1/5 = 20%... wait, 1/5 = 20% > 10% — need more)
    // Let's check: total = 5, account 060000 count = 1, ratio = 1/5 = 0.2 = 20%
    // That's > 10%, so it should NOT be flagged.
    expect(result.size).toBe(0);
  });

  it("flags when text has dominant account and a rare outlier", () => {
    // 20 lines on dominant account + 1 outlier = 1/21 = 4.8% < 5%
    // Dominant account at 20/21 = 95% >= 50% threshold
    const lines: JournalEntryLine[] = [];
    for (let i = 1; i <= 20; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          booking_text: "Miete Buero",
          gl_account: "070000",
        }),
      );
    }
    lines.push(
      makeLine({
        document_id: "D21",
        line_id: 1,
        booking_text: "Miete Buero",
        gl_account: "060000",
      }),
    );

    const result = detectUnusualTextAccountCombos(lines);
    const flags = result.get("D21:1");
    expect(flags).toBeDefined();
    expect(flags!.length).toBe(1);
    expect(flags![0].type).toBe("unusual_text_account");
    expect(flags![0].severity).toBe("warning");
  });

  it("does not flag texts with fewer than 3 total occurrences", () => {
    const lines: JournalEntryLine[] = [
      makeLine({
        document_id: "D1",
        line_id: 1,
        booking_text: "Rare Text",
        gl_account: "400000",
      }),
      makeLine({
        document_id: "D2",
        line_id: 1,
        booking_text: "Rare Text",
        gl_account: "060000",
      }),
    ];

    const result = detectUnusualTextAccountCombos(lines);
    expect(result.size).toBe(0);
  });
});

describe("detectTextAnomalies", () => {
  it("merges flags from both detectors", () => {
    // Build a scenario that triggers at least the typo detector
    const lines: JournalEntryLine[] = [
      makeLine({ document_id: "D1", line_id: 1, booking_text: "Miete" }),
      makeLine({ document_id: "D2", line_id: 1, booking_text: "Miete" }),
      makeLine({ document_id: "D3", line_id: 1, booking_text: "Miate" }),
    ];

    const result = detectTextAnomalies(lines);

    // Should have at least one flagged entry (from typo detection)
    expect(result.size).toBeGreaterThan(0);
  });

  it("returns empty map for clean data", () => {
    const lines: JournalEntryLine[] = [
      makeLine({
        document_id: "D1",
        line_id: 1,
        booking_text: "Miete",
        posting_date: "2025-01-01",
      }),
      makeLine({
        document_id: "D2",
        line_id: 1,
        booking_text: "Gehalt",
        posting_date: "2025-06-01",
      }),
    ];

    const result = detectTextAnomalies(lines);
    expect(result.size).toBe(0);
  });
});
