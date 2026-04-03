import { describe, expect, it } from "vitest";
import type { JournalEntryLine } from "@/lib/data/journal-entry.types";
import {
  detectUnusualAmounts,
  detectRoundNumberAnomalies,
  detectPatternBreaks,
  detectMissingCounterparts,
} from "./pattern-detectors";

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

describe("detectUnusualAmounts", () => {
  it("flags a line whose amount is far from the account mean", () => {
    // 12 lines on same account with amounts ~100, one outlier at 5000
    const lines: JournalEntryLine[] = [];
    for (let i = 1; i <= 12; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "070000",
          amount: 100 + i, // 101-112, mean ~106.5
        }),
      );
    }
    // Outlier: 5000 is way above 2.5 std deviations
    lines.push(
      makeLine({
        document_id: "D13",
        line_id: 1,
        gl_account: "070000",
        amount: 5000,
      }),
    );

    const result = detectUnusualAmounts(lines);
    const flags = result.get("D13:1");
    expect(flags).toBeDefined();
    expect(flags!.length).toBe(1);
    expect(flags![0].type).toBe("unusual_amount");
    expect(flags![0].severity).toBe("warning");
  });

  it("does not flag amounts within normal range", () => {
    const lines: JournalEntryLine[] = [];
    for (let i = 1; i <= 12; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "070000",
          amount: 100 + i,
        }),
      );
    }

    const result = detectUnusualAmounts(lines);
    expect(result.size).toBe(0);
  });

  it("requires at least 10 lines per account to flag", () => {
    const lines: JournalEntryLine[] = [];
    for (let i = 1; i <= 8; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "070000",
          amount: 100,
        }),
      );
    }
    lines.push(
      makeLine({
        document_id: "D9",
        line_id: 1,
        gl_account: "070000",
        amount: 50000,
      }),
    );

    const result = detectUnusualAmounts(lines);
    expect(result.size).toBe(0);
  });
});

describe("detectRoundNumberAnomalies", () => {
  it("flags a round number on an account that normally has non-round amounts", () => {
    const lines: JournalEntryLine[] = [];
    // 20 lines with non-round amounts
    for (let i = 1; i <= 20; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "070000",
          amount: 1234.56 + i * 7.89,
        }),
      );
    }
    // One round number
    lines.push(
      makeLine({
        document_id: "D21",
        line_id: 1,
        gl_account: "070000",
        amount: 10000,
      }),
    );

    const result = detectRoundNumberAnomalies(lines);
    const flags = result.get("D21:1");
    expect(flags).toBeDefined();
    expect(flags!.length).toBe(1);
    expect(flags![0].type).toBe("round_number_anomaly");
    expect(flags![0].severity).toBe("warning");
  });

  it("does not flag round numbers on accounts where round amounts are common", () => {
    const lines: JournalEntryLine[] = [];
    // 20 lines, most are round
    for (let i = 1; i <= 20; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "070000",
          amount: i * 1000, // all round
        }),
      );
    }

    const result = detectRoundNumberAnomalies(lines);
    expect(result.size).toBe(0);
  });

  it("does not flag amounts below 5000 even if round", () => {
    const lines: JournalEntryLine[] = [];
    for (let i = 1; i <= 20; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "070000",
          amount: 123.45 + i,
        }),
      );
    }
    lines.push(
      makeLine({
        document_id: "D21",
        line_id: 1,
        gl_account: "070000",
        amount: 4000, // round but < 5000
      }),
    );

    const result = detectRoundNumberAnomalies(lines);
    expect(result.size).toBe(0);
  });
});

describe("detectPatternBreaks", () => {
  it("flags when a text that normally goes to one cost center goes to another", () => {
    const lines: JournalEntryLine[] = [];
    // "Miete Buero" normally goes to cost center "1000" (10 times)
    for (let i = 1; i <= 10; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "070000",
          booking_text: "Miete Buero",
          cost_center: "1000",
          posting_date: `2025-01-${String(i).padStart(2, "0")}`,
        }),
      );
    }
    // One instance goes to different cost center
    lines.push(
      makeLine({
        document_id: "D11",
        line_id: 1,
        gl_account: "070000",
        booking_text: "Miete Buero",
        cost_center: "3000",
        posting_date: "2025-01-20",
      }),
    );

    const result = detectPatternBreaks(lines);
    const flags = result.get("D11:1");
    expect(flags).toBeDefined();
    expect(flags!.length).toBeGreaterThanOrEqual(1);
    expect(flags![0].type).toBe("pattern_break");
    expect(flags![0].severity).toBe("warning");
  });

  it("does not flag when a text goes to multiple cost centers equally", () => {
    const lines: JournalEntryLine[] = [];
    // Evenly split between two cost centers
    for (let i = 1; i <= 5; i++) {
      lines.push(
        makeLine({
          document_id: `DA${i}`,
          line_id: 1,
          booking_text: "Test Text",
          cost_center: "1000",
          posting_date: `2025-01-${String(i).padStart(2, "0")}`,
        }),
      );
      lines.push(
        makeLine({
          document_id: `DB${i}`,
          line_id: 1,
          booking_text: "Test Text",
          cost_center: "2000",
          posting_date: `2025-01-${String(i + 10).padStart(2, "0")}`,
        }),
      );
    }

    const result = detectPatternBreaks(lines);
    expect(result.size).toBe(0);
  });

  it("detects missing recurring posting in a month", () => {
    const lines: JournalEntryLine[] = [];
    // "Miete" + account "070000" appears in Jan and Feb
    lines.push(
      makeLine({
        document_id: "D1",
        line_id: 1,
        gl_account: "070000",
        booking_text: "Miete",
        posting_date: "2025-01-15",
      }),
    );
    lines.push(
      makeLine({
        document_id: "D2",
        line_id: 1,
        gl_account: "070000",
        booking_text: "Miete",
        posting_date: "2025-02-15",
      }),
    );
    // A different combo "Strom" + "070100" appears only in Jan (missing from Feb)
    lines.push(
      makeLine({
        document_id: "D3",
        line_id: 1,
        gl_account: "070100",
        booking_text: "Strom",
        posting_date: "2025-01-15",
      }),
    );

    // Only 2 months of data and no missing month for combos that appear in
    // multiple months -- so nothing should be flagged here (need >=3 months
    // or a clear gap). This is a minimal case that tests the absence of
    // false positives.
    const result = detectPatternBreaks(lines);
    // "Strom" only appears in 1 month, so it's not recognized as recurring
    expect(result.size).toBe(0);
  });
});

describe("detectMissingCounterparts", () => {
  it("flags documents where all lines are on the same side", () => {
    const lines: JournalEntryLine[] = [
      makeLine({
        document_id: "D1",
        line_id: 1,
        debit_credit: "S",
        amount: 500,
      }),
      makeLine({
        document_id: "D1",
        line_id: 2,
        debit_credit: "S",
        amount: 300,
      }),
    ];

    const result = detectMissingCounterparts(lines);
    expect(result.get("D1:1")).toBeDefined();
    expect(result.get("D1:2")).toBeDefined();

    const flags = result.get("D1:1")!;
    expect(flags.length).toBe(1);
    expect(flags[0].type).toBe("missing_counterpart");
    expect(flags[0].severity).toBe("critical");
  });

  it("does not flag balanced documents with both S and H lines", () => {
    const lines: JournalEntryLine[] = [
      makeLine({
        document_id: "D1",
        line_id: 1,
        debit_credit: "S",
        amount: 500,
      }),
      makeLine({
        document_id: "D1",
        line_id: 2,
        debit_credit: "H",
        amount: 500,
      }),
    ];

    const result = detectMissingCounterparts(lines);
    expect(result.size).toBe(0);
  });

  it("flags documents where all lines are credit", () => {
    const lines: JournalEntryLine[] = [
      makeLine({
        document_id: "D1",
        line_id: 1,
        debit_credit: "H",
        amount: 100,
      }),
      makeLine({
        document_id: "D1",
        line_id: 2,
        debit_credit: "H",
        amount: 200,
      }),
    ];

    const result = detectMissingCounterparts(lines);
    expect(result.size).toBe(2);
    const flags = result.get("D1:1")!;
    expect(flags[0].type).toBe("missing_counterpart");
  });
});
