/**
 * Represents a single line item in a journal entry (SAP FI style).
 * Each document consists of 2+ lines that must balance (total S = total H).
 */
export interface JournalEntryLine {
  /** Company code (e.g. "1000") */
  company_code: string;
  /** Posting date in ISO format (YYYY-MM-DD) */
  posting_date: string;
  /** Document number identifying the journal entry */
  document_id: string;
  /** Line item number within the document */
  line_id: number;
  /** General ledger account, 6-digit zero-padded */
  gl_account: string;
  /** Cost center assignment (null for balance sheet accounts) */
  cost_center: string | null;
  /** Amount in document currency (always positive) */
  amount: number;
  /** Document currency (e.g. "EUR") */
  currency: string;
  /** Debit/Credit indicator: "S" = Soll (debit), "H" = Haben (credit) */
  debit_credit: "S" | "H";
  /** Posting text describing the transaction */
  booking_text: string;
  /** Vendor ID for vendor-related postings (null otherwise) */
  vendor_id: string | null;
  /** Customer ID for customer-related postings (null otherwise) */
  customer_id: string | null;
  /** Tax code (e.g. "V19" for input VAT, "A19" for output VAT) */
  tax_code: string | null;
  /** SAP document type (e.g. "KR", "DR", "SA") */
  document_type: string;
}
