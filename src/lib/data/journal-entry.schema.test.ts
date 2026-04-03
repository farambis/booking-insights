import { describe, expect, it } from "vitest";
import { z } from "zod";
import { journalEntryLineSchema } from "./journal-entry.schema";

const validLine = {
  company_code: "1000",
  posting_date: "2025-01-15",
  document_id: "DOC-001",
  line_id: 1,
  gl_account: "070000",
  cost_center: null,
  amount: 1500.0,
  currency: "EUR",
  debit_credit: "S",
  booking_text: "Miete Januar",
  vendor_id: null,
  customer_id: null,
  tax_code: null,
  document_type: "SA",
};

describe("journalEntryLineSchema", () => {
  it("parses a valid journal entry line", () => {
    const result = journalEntryLineSchema.parse(validLine);
    expect(result).toEqual(validLine);
  });

  it("parses a line with all nullable fields populated", () => {
    const line = {
      ...validLine,
      cost_center: "1000",
      vendor_id: "V-001",
      customer_id: "C-001",
      tax_code: "V19",
    };
    const result = journalEntryLineSchema.parse(line);
    expect(result).toEqual(line);
  });

  it("accepts debit_credit value H", () => {
    const line = { ...validLine, debit_credit: "H" };
    const result = journalEntryLineSchema.parse(line);
    expect(result.debit_credit).toBe("H");
  });

  it("rejects an invalid debit_credit value", () => {
    const line = { ...validLine, debit_credit: "X" };
    expect(() => journalEntryLineSchema.parse(line)).toThrow();
  });

  it("rejects a missing required field", () => {
    const { document_id: _, ...incomplete } = validLine;
    expect(() => journalEntryLineSchema.parse(incomplete)).toThrow();
  });

  it("rejects a wrong type for amount", () => {
    const line = { ...validLine, amount: "not a number" };
    expect(() => journalEntryLineSchema.parse(line)).toThrow();
  });

  it("rejects a wrong type for line_id", () => {
    const line = { ...validLine, line_id: "abc" };
    expect(() => journalEntryLineSchema.parse(line)).toThrow();
  });

  it("validates an array of lines", () => {
    const lines = [validLine, { ...validLine, document_id: "DOC-002" }];
    const result = z.array(journalEntryLineSchema).parse(lines);
    expect(result).toHaveLength(2);
  });

  it("throws a clear message for invalid array elements", () => {
    const lines = [validLine, { ...validLine, amount: "bad" }];
    expect(() => z.array(journalEntryLineSchema).parse(lines)).toThrow();
  });
});
