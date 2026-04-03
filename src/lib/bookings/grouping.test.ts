import { describe, expect, it } from "vitest";
import type { JournalEntryLine } from "@/lib/data/journal-entry.types";
import { groupByDocument, groupByField } from "./grouping";

function makeLine(overrides: Partial<JournalEntryLine> = {}): JournalEntryLine {
  return {
    company_code: "1000",
    posting_date: "2025-01-15",
    document_id: "DOC-001",
    line_id: 1,
    gl_account: "070000",
    cost_center: null,
    amount: 100,
    currency: "EUR",
    debit_credit: "S",
    booking_text: "Test booking",
    vendor_id: null,
    customer_id: null,
    tax_code: null,
    document_type: "SA",
    ...overrides,
  };
}

describe("groupByDocument", () => {
  it("groups lines by document_id", () => {
    const lines = [
      makeLine({ document_id: "D1", line_id: 1 }),
      makeLine({ document_id: "D1", line_id: 2 }),
      makeLine({ document_id: "D2", line_id: 1 }),
    ];

    const result = groupByDocument(lines);

    expect(result.size).toBe(2);
    expect(result.get("D1")).toHaveLength(2);
    expect(result.get("D2")).toHaveLength(1);
  });

  it("returns an empty map for empty input", () => {
    const result = groupByDocument([]);
    expect(result.size).toBe(0);
  });

  it("preserves all lines in each group", () => {
    const line1 = makeLine({ document_id: "D1", line_id: 1, amount: 100 });
    const line2 = makeLine({ document_id: "D1", line_id: 2, amount: 200 });

    const result = groupByDocument([line1, line2]);
    const group = result.get("D1")!;

    expect(group).toContain(line1);
    expect(group).toContain(line2);
  });
});

describe("groupByField", () => {
  it("groups items by the key function result", () => {
    const items = [
      { name: "a", category: "x" },
      { name: "b", category: "x" },
      { name: "c", category: "y" },
    ];

    const result = groupByField(items, (item) => item.category);

    expect(result.size).toBe(2);
    expect(result.get("x")).toHaveLength(2);
    expect(result.get("y")).toHaveLength(1);
  });

  it("skips items where keyFn returns null", () => {
    const items = [
      { name: "a", category: "x" as string | null },
      { name: "b", category: null },
    ];

    const result = groupByField(items, (item) => item.category);

    expect(result.size).toBe(1);
    expect(result.get("x")).toHaveLength(1);
  });

  it("returns an empty map for empty input", () => {
    const result = groupByField([], () => "key");
    expect(result.size).toBe(0);
  });

  it("works with journal entry lines grouped by gl_account", () => {
    const lines = [
      makeLine({ gl_account: "070000" }),
      makeLine({ gl_account: "070000" }),
      makeLine({ gl_account: "060000" }),
    ];

    const result = groupByField(lines, (l) => l.gl_account);

    expect(result.size).toBe(2);
    expect(result.get("070000")).toHaveLength(2);
    expect(result.get("060000")).toHaveLength(1);
  });
});
