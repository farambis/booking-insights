import type { FlagType } from "./booking.types";

/** Format amount with 2 decimals, thousand separator, and currency */
export function formatAmount(amount: number, currency: string = "EUR"): string {
  const formatted = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currency}`;
}

/** Format ISO date to DD.MM.YYYY */
export function formatDateCompact(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    return isoDate;
  }
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

/** Format ISO date to verbose German format, e.g. "31. Januar 2025" */
export function formatDateVerbose(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00");
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const FLAG_TYPE_LABELS: Record<FlagType, string> = {
  duplicate_entry: "Duplicate Entry",
  duplicate_booking: "Duplicate Booking",
  missing_counterpart: "Missing Counterpart",
  unusual_amount: "Unusual Amount",
  pattern_break: "Pattern Break",
  round_number_anomaly: "Round Number Anomaly",
  text_typo: "Text Typo",
  unusual_text_account: "Unusual Text-Account Combo",
  text_duplicate_posting: "Text Duplicate Posting",
};

/** Map FlagType to human-readable label */
export function flagTypeLabel(type: FlagType): string {
  return FLAG_TYPE_LABELS[type];
}

/** Map confidence score to display label */
export function confidenceLabel(score: number): "High" | "Medium" | "Low" {
  if (score >= 0.7) return "High";
  if (score >= 0.4) return "Medium";
  return "Low";
}

/** Format account as "060000 -- Gehalter" or just "060000" if no name */
export function formatAccount(number: string, name: string | null): string {
  if (name) return `${number} \u2014 ${name}`;
  return number;
}

/** Format document type as "KR -- Kreditorenrechnung (Vendor Invoice)" */
export function formatDocumentType(code: string): string {
  const DOCUMENT_TYPE_NAMES: Record<string, string> = {
    KR: "Kreditorenrechnung (Vendor Invoice)",
    DR: "Debitorenrechnung (Customer Invoice)",
    KZ: "Kreditorenzahlung (Vendor Payment)",
    DZ: "Debitorenzahlung (Customer Payment)",
    SA: "Sachkontenbeleg (GL Posting)",
    AB: "Ausgleichsbeleg (Clearing)",
  };
  const name = DOCUMENT_TYPE_NAMES[code];
  if (name) return `${code} \u2014 ${name}`;
  return code;
}

/** Format debit/credit indicator for display */
export function formatDebitCredit(indicator: "S" | "H"): string {
  return indicator === "S" ? "Soll" : "Haben";
}
