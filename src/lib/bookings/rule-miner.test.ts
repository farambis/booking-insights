import { describe, expect, it } from "vitest";
import type { JournalEntryLine } from "@/lib/data/journal-entry.types";
import {
  mineAccountTaxCodeRules,
  mineAccountCostCenterRules,
  mineDocumentTypeAccountRules,
  mineRecurringTextRules,
  mineAmountRangeRules,
  mineBookingRules,
} from "./rule-miner";

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

describe("mineAccountTaxCodeRules", () => {
  it("emits a rule when one tax code dominates an account (>=80%)", () => {
    const lines: JournalEntryLine[] = [];
    // 5 lines with tax_code V19
    for (let i = 0; i < 5; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "070000",
          tax_code: "V19",
        }),
      );
    }
    // 1 line with different tax code
    lines.push(
      makeLine({
        document_id: "D5",
        line_id: 1,
        gl_account: "070000",
        tax_code: "V7",
      }),
    );

    const rules = mineAccountTaxCodeRules(lines);

    expect(rules.length).toBe(1);
    expect(rules[0].category).toBe("account_tax_code");
    expect(rules[0].title).toContain("070000");
    expect(rules[0].title).toContain("V19");
    // Confidence is adjusted for sample size (5 lines), so lower than raw 80%
    expect(rules[0].confidence).toBeGreaterThan(0);
    expect(rules[0].confidence).toBeLessThan(rules[0].supportRatio);
    expect(rules[0].evidence.length).toBeLessThanOrEqual(3);
    expect(rules[0].violationCount).toBe(1);
    expect(rules[0].scope.category).toBe("account_tax_code");
    if (rules[0].scope.category !== "account_tax_code")
      throw new Error("unexpected");
    expect(rules[0].scope.glAccount).toBe("070000");
    expect(rules[0].scope.taxCode).toBe("V19");
  });

  it("does not emit a rule when no tax code dominates", () => {
    const lines: JournalEntryLine[] = [];
    // 3 V19, 3 V7 = 50% each
    for (let i = 0; i < 3; i++) {
      lines.push(
        makeLine({
          document_id: `DA${i}`,
          line_id: 1,
          gl_account: "070000",
          tax_code: "V19",
        }),
      );
      lines.push(
        makeLine({
          document_id: `DB${i}`,
          line_id: 1,
          gl_account: "070000",
          tax_code: "V7",
        }),
      );
    }

    const rules = mineAccountTaxCodeRules(lines);
    expect(rules.length).toBe(0);
  });

  it("skips accounts with fewer than 5 non-null tax code lines", () => {
    const lines: JournalEntryLine[] = [];
    for (let i = 0; i < 4; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "070000",
          tax_code: "V19",
        }),
      );
    }

    const rules = mineAccountTaxCodeRules(lines);
    expect(rules.length).toBe(0);
  });

  it("ignores lines where tax_code is null", () => {
    const lines: JournalEntryLine[] = [];
    // 3 with tax_code, 10 with null
    for (let i = 0; i < 3; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "070000",
          tax_code: "V19",
        }),
      );
    }
    for (let i = 3; i < 13; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "070000",
          tax_code: null,
        }),
      );
    }

    const rules = mineAccountTaxCodeRules(lines);
    expect(rules.length).toBe(0);
  });
});

describe("mineAccountCostCenterRules", () => {
  it("emits a rule when one cost center dominates an account (>=80%)", () => {
    const lines: JournalEntryLine[] = [];
    for (let i = 0; i < 5; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "060000",
          cost_center: "1000",
        }),
      );
    }
    lines.push(
      makeLine({
        document_id: "D5",
        line_id: 1,
        gl_account: "060000",
        cost_center: "2000",
      }),
    );

    const rules = mineAccountCostCenterRules(lines);

    expect(rules.length).toBe(1);
    expect(rules[0].category).toBe("account_cost_center");
    expect(rules[0].title).toContain("060000");
    expect(rules[0].title).toContain("1000");
    expect(rules[0].violationCount).toBe(1);
    expect(rules[0].scope.category).toBe("account_cost_center");
    if (rules[0].scope.category !== "account_cost_center")
      throw new Error("unexpected");
    expect(rules[0].scope.glAccount).toBe("060000");
    expect(rules[0].scope.costCenter).toBe("1000");
  });

  it("does not emit a rule when fewer than 5 non-null cost center lines", () => {
    const lines: JournalEntryLine[] = [];
    for (let i = 0; i < 4; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "060000",
          cost_center: "1000",
        }),
      );
    }

    const rules = mineAccountCostCenterRules(lines);
    expect(rules.length).toBe(0);
  });
});

describe("mineDocumentTypeAccountRules", () => {
  it("emits a rule when one account range dominates a document type (>=70%)", () => {
    const lines: JournalEntryLine[] = [];
    // 8 lines with document_type KR and operating expenses range
    for (let i = 0; i < 8; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          document_type: "KR",
          gl_account: "070000",
        }),
      );
    }
    // 2 lines with KR but different range
    for (let i = 8; i < 10; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          document_type: "KR",
          gl_account: "040000",
        }),
      );
    }

    const rules = mineDocumentTypeAccountRules(lines);

    expect(rules.length).toBe(1);
    expect(rules[0].category).toBe("document_type_account");
    expect(rules[0].title).toContain("KR");
    expect(rules[0].title).toContain("Operating expenses");
    expect(rules[0].scope.category).toBe("document_type_account");
    if (rules[0].scope.category !== "document_type_account")
      throw new Error("unexpected");
    expect(rules[0].scope.documentType).toBe("KR");
    expect(rules[0].scope.accountRange).toBe("Operating expenses");
  });

  it("does not emit a rule when no range dominates", () => {
    const lines: JournalEntryLine[] = [];
    // 5 with revenue, 5 with expenses
    for (let i = 0; i < 5; i++) {
      lines.push(
        makeLine({
          document_id: `DA${i}`,
          line_id: 1,
          document_type: "SA",
          gl_account: "040000",
        }),
      );
      lines.push(
        makeLine({
          document_id: `DB${i}`,
          line_id: 1,
          document_type: "SA",
          gl_account: "070000",
        }),
      );
    }

    const rules = mineDocumentTypeAccountRules(lines);
    expect(rules.length).toBe(0);
  });
});

describe("mineRecurringTextRules", () => {
  it("emits a rule when text appears in >=3 months with same account >=80%", () => {
    const lines: JournalEntryLine[] = [];
    const months = ["2025-01-15", "2025-02-15", "2025-03-15", "2025-04-15"];
    for (const date of months) {
      lines.push(
        makeLine({
          document_id: `D-${date}`,
          line_id: 1,
          posting_date: date,
          booking_text: "Miete Hauptgebäude",
          gl_account: "070000",
        }),
      );
    }

    const rules = mineRecurringTextRules(lines);

    expect(rules.length).toBe(1);
    expect(rules[0].category).toBe("recurring_text");
    expect(rules[0].title).toContain("Miete Hauptgebäude");
    expect(rules[0].title).toContain("070000");
    expect(rules[0].scope.category).toBe("recurring_text");
    if (rules[0].scope.category !== "recurring_text")
      throw new Error("unexpected");
    expect(rules[0].scope.textPattern).toBe("Miete Hauptgebäude");
    expect(rules[0].scope.glAccount).toBe("070000");
  });

  it("normalizes text before grouping (strips trailing dates)", () => {
    const lines: JournalEntryLine[] = [];
    const months = ["2025-01-15", "2025-02-15", "2025-03-15"];
    for (const date of months) {
      lines.push(
        makeLine({
          document_id: `D-${date}`,
          line_id: 1,
          posting_date: date,
          booking_text: `Rechnung ${date}`,
          gl_account: "070000",
        }),
      );
    }

    const rules = mineRecurringTextRules(lines);

    expect(rules.length).toBe(1);
    expect(rules[0].title).toContain("Rechnung");
  });

  it("does not emit a rule for text appearing in fewer than 2 months", () => {
    const lines: JournalEntryLine[] = [
      makeLine({
        document_id: "D-1",
        line_id: 1,
        posting_date: "2025-01-15",
        booking_text: "Miete",
        gl_account: "070000",
      }),
      makeLine({
        document_id: "D-2",
        line_id: 1,
        posting_date: "2025-01-20",
        booking_text: "Miete",
        gl_account: "070000",
      }),
    ];

    const rules = mineRecurringTextRules(lines);
    expect(rules.length).toBe(0);
  });
});

describe("mineAmountRangeRules", () => {
  it("emits a rule with Q1-Q3 range for accounts with >=10 lines and low CV", () => {
    const lines: JournalEntryLine[] = [];
    // Amounts around 100 with low variability
    const amounts = [95, 98, 99, 100, 100, 101, 102, 103, 105, 110];
    for (let i = 0; i < amounts.length; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "070000",
          amount: amounts[i],
        }),
      );
    }

    const rules = mineAmountRangeRules(lines);

    expect(rules.length).toBe(1);
    expect(rules[0].category).toBe("amount_range");
    expect(rules[0].title).toContain("070000");
    expect(rules[0].scope.category).toBe("amount_range");
    if (rules[0].scope.category !== "amount_range")
      throw new Error("unexpected");
    expect(rules[0].scope.glAccount).toBe("070000");
    expect(rules[0].scope.amountMin).toBeDefined();
    expect(rules[0].scope.amountMax).toBeDefined();
    expect(rules[0].scope.amountMin).toBeLessThan(rules[0].scope.amountMax);
  });

  it("skips accounts with high coefficient of variation (>1.5)", () => {
    const lines: JournalEntryLine[] = [];
    // Highly variable amounts
    const amounts = [1, 5, 10, 50, 100, 500, 1000, 5000, 10000, 50000];
    for (let i = 0; i < amounts.length; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "070000",
          amount: amounts[i],
        }),
      );
    }

    const rules = mineAmountRangeRules(lines);
    expect(rules.length).toBe(0);
  });

  it("skips accounts with fewer than 10 lines", () => {
    const lines: JournalEntryLine[] = [];
    for (let i = 0; i < 9; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "070000",
          amount: 100,
        }),
      );
    }

    const rules = mineAmountRangeRules(lines);
    expect(rules.length).toBe(0);
  });
});

describe("mineBookingRules (orchestrator)", () => {
  it("filters out rules below minimum confidence", () => {
    // Confidence is adjusted for sample size, threshold is 0.4
    // Verify all returned rules meet the minimum
    const lines: JournalEntryLine[] = [];
    for (let i = 0; i < 10; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "070000",
          tax_code: "V19",
          cost_center: "1000",
          amount: 100,
          posting_date: `2025-${String(i + 1).padStart(2, "0")}-15`,
          booking_text: "Miete",
        }),
      );
    }

    const manual = mineBookingRules(lines);

    for (const rule of manual.rules) {
      expect(rule.confidence).toBeGreaterThanOrEqual(0.4);
    }
  });

  it("returns at most 10 rules", () => {
    // Lots of varied data to produce many potential rules
    const lines: JournalEntryLine[] = [];
    const accounts = [
      "070000",
      "070100",
      "070200",
      "070300",
      "070400",
      "070500",
      "060000",
      "060100",
      "060200",
      "050000",
      "050100",
      "040000",
    ];
    for (const account of accounts) {
      for (let i = 0; i < 10; i++) {
        lines.push(
          makeLine({
            document_id: `D-${account}-${i}`,
            line_id: 1,
            gl_account: account,
            tax_code: "V19",
            cost_center: "1000",
            amount: 100 + i,
            posting_date: `2025-${String((i % 12) + 1).padStart(2, "0")}-15`,
            booking_text: `Buchung ${account}`,
          }),
        );
      }
    }

    const manual = mineBookingRules(lines);
    expect(manual.rules.length).toBeLessThanOrEqual(10);
  });

  it("assigns stable IDs based on category and scope", () => {
    const lines: JournalEntryLine[] = [];
    for (let i = 0; i < 6; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "070000",
          tax_code: "V19",
        }),
      );
    }

    const manual = mineBookingRules(lines);

    for (const rule of manual.rules) {
      expect(rule.id).toContain(":");
      expect(rule.id.startsWith(rule.category)).toBe(true);
    }
  });

  it("sorts rules by confidence * supportRatio descending", () => {
    const lines: JournalEntryLine[] = [];
    for (let i = 0; i < 10; i++) {
      lines.push(
        makeLine({
          document_id: `D${i}`,
          line_id: 1,
          gl_account: "070000",
          tax_code: "V19",
          cost_center: "1000",
          amount: 100 + i,
          posting_date: `2025-${String((i % 12) + 1).padStart(2, "0")}-15`,
          booking_text: "Miete",
        }),
      );
    }

    const manual = mineBookingRules(lines);
    const scores = manual.rules.map((r) => r.confidence * r.supportRatio);

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });

  it("includes datasetSize and generatedAt in result", () => {
    const lines: JournalEntryLine[] = [];
    for (let i = 0; i < 5; i++) {
      lines.push(makeLine({ document_id: `D${i}`, line_id: 1 }));
    }

    const manual = mineBookingRules(lines);

    expect(manual.datasetSize).toBe(5);
    expect(manual.generatedAt).toBeDefined();
    expect(typeof manual.generatedAt).toBe("string");
  });

  it("produces 5-10 rules from actual journal entries", async () => {
    const journalEntries = (await import("@/lib/data/journal-entries.json"))
      .default;

    const manual = mineBookingRules(journalEntries as JournalEntryLine[]);

    expect(manual.rules.length).toBeGreaterThanOrEqual(5);
    expect(manual.rules.length).toBeLessThanOrEqual(10);
    expect(manual.datasetSize).toBeGreaterThan(0);
  });
});
