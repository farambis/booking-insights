import { describe, expect, it } from "vitest";
import type { JournalEntryLine } from "./journal-entry.types";

describe("JournalEntryLine type", () => {
  it("can construct a valid journal entry line", () => {
    const line: JournalEntryLine = {
      company_code: "1000",
      posting_date: "2025-01-15",
      document_id: "5000000001",
      line_id: 1,
      gl_account: "070100",
      cost_center: "1000",
      amount: 1500.0,
      currency: "EUR",
      debit_credit: "S",
      booking_text: "Miete Büro Januar",
      vendor_id: null,
      customer_id: null,
      tax_code: null,
      document_type: "SA",
    };

    expect(line.company_code).toBe("1000");
    expect(line.debit_credit).toBe("S");
    expect(line.amount).toBe(1500.0);
    expect(line.gl_account).toMatch(/^\d{6}$/);
  });

  it("allows vendor_id for vendor-related postings", () => {
    const line: JournalEntryLine = {
      company_code: "1000",
      posting_date: "2025-01-10",
      document_id: "5000000002",
      line_id: 1,
      gl_account: "070200",
      cost_center: "4000",
      amount: 250.0,
      currency: "EUR",
      debit_credit: "S",
      booking_text: "Telefonkosten",
      vendor_id: "V0001",
      customer_id: null,
      tax_code: "V19",
      document_type: "KR",
    };

    expect(line.vendor_id).toBe("V0001");
    expect(line.customer_id).toBeNull();
  });

  it("allows customer_id for customer-related postings", () => {
    const line: JournalEntryLine = {
      company_code: "1000",
      posting_date: "2025-01-20",
      document_id: "5000000003",
      line_id: 1,
      gl_account: "040100",
      cost_center: null,
      amount: 5000.0,
      currency: "EUR",
      debit_credit: "H",
      booking_text: "Kundenrechnung 2025-001",
      vendor_id: null,
      customer_id: "C0001",
      tax_code: "A19",
      document_type: "DR",
    };

    expect(line.customer_id).toBe("C0001");
    expect(line.vendor_id).toBeNull();
  });
});
