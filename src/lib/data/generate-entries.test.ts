import { describe, expect, it } from "vitest";
import { generateJournalEntries } from "./generate-entries";
import type { JournalEntryLine } from "./journal-entry.types";

describe("generateJournalEntries", () => {
  const result = generateJournalEntries();
  const lines: JournalEntryLine[] = result.lines;
  const anomalies: string[] = result.anomalies;

  it("generates between 400 and 600 lines", () => {
    expect(lines.length).toBeGreaterThanOrEqual(400);
    expect(lines.length).toBeLessThanOrEqual(600);
  });

  it("produces deterministic output (same data every run)", () => {
    const second = generateJournalEntries();
    expect(second.lines).toEqual(lines);
  });

  it("all posting dates are within the last two months", () => {
    const now = new Date();
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const startDate = `${twoMonthsAgo.getFullYear()}-${String(twoMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDay = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth() + 1,
      0,
    ).getDate();
    const endDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;

    for (const line of lines) {
      expect(line.posting_date >= startDate).toBe(true);
      expect(line.posting_date <= endDate).toBe(true);
    }
  });

  it("every document balances (sum of S = sum of H) except intentional missing-counterpart anomalies", () => {
    const missingCounterpartDocs = new Set(
      anomalies
        .filter((a) => a.startsWith("MISSING_COUNTERPART:"))
        .map((a) => a.match(/Document (\d+)/)?.[1])
        .filter(Boolean),
    );

    const byDoc = new Map<string, JournalEntryLine[]>();
    for (const line of lines) {
      const arr = byDoc.get(line.document_id) ?? [];
      arr.push(line);
      byDoc.set(line.document_id, arr);
    }

    for (const [docId, docLines] of byDoc) {
      if (missingCounterpartDocs.has(docId)) continue;
      const debitSum = docLines
        .filter((l) => l.debit_credit === "S")
        .reduce((s, l) => s + l.amount, 0);
      const creditSum = docLines
        .filter((l) => l.debit_credit === "H")
        .reduce((s, l) => s + l.amount, 0);
      expect(Math.abs(debitSum - creditSum)).toBeLessThan(0.01);
    }
  });

  it("applies missing counterpart anomalies", () => {
    const mcAnomalies = anomalies.filter((a) =>
      a.startsWith("MISSING_COUNTERPART:"),
    );
    expect(mcAnomalies.length).toBeGreaterThanOrEqual(1);
  });

  it("each document has 2-5 lines", () => {
    const byDoc = new Map<string, number>();
    for (const line of lines) {
      byDoc.set(line.document_id, (byDoc.get(line.document_id) ?? 0) + 1);
    }
    for (const [, count] of byDoc) {
      expect(count).toBeGreaterThanOrEqual(2);
      expect(count).toBeLessThanOrEqual(5);
    }
  });

  it("all amounts are positive", () => {
    for (const line of lines) {
      expect(line.amount).toBeGreaterThan(0);
    }
  });

  it("company_code is always 1000 and currency is always EUR", () => {
    for (const line of lines) {
      expect(line.company_code).toBe("1000");
      expect(line.currency).toBe("EUR");
    }
  });

  it("gl_account is always 6-digit zero-padded", () => {
    for (const line of lines) {
      expect(line.gl_account).toMatch(/^\d{6}$/);
    }
  });

  it("vendor_id is set for vendor-related document types (KR, KZ)", () => {
    const vendorLines = lines.filter(
      (l) =>
        (l.document_type === "KR" || l.document_type === "KZ") &&
        l.vendor_id !== null,
    );
    expect(vendorLines.length).toBeGreaterThan(0);
  });

  it("customer_id is set for customer-related document types (DR, DZ)", () => {
    const customerLines = lines.filter(
      (l) =>
        (l.document_type === "DR" || l.document_type === "DZ") &&
        l.customer_id !== null,
    );
    expect(customerLines.length).toBeGreaterThan(0);
  });

  it("logs anomalies", () => {
    expect(anomalies.length).toBeGreaterThanOrEqual(7);
  });

  it("applies at least 3 typo anomalies", () => {
    const typoAnomalies = anomalies.filter((a) => a.startsWith("TYPO:"));
    expect(typoAnomalies.length).toBeGreaterThanOrEqual(3);
  });

  it("line_id values are sequential within each document", () => {
    const byDoc = new Map<string, number[]>();
    for (const line of lines) {
      const arr = byDoc.get(line.document_id) ?? [];
      arr.push(line.line_id);
      byDoc.set(line.document_id, arr);
    }
    for (const [, lineIds] of byDoc) {
      const sorted = [...lineIds].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length; i++) {
        expect(sorted[i]).toBe(i + 1);
      }
    }
  });
});
