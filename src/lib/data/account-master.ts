/**
 * Account master data for a German mid-size company (SAP FI conventions).
 *
 * Account range structure (6-digit, zero-padded):
 *   010000-019999  Assets (Anlagevermögen)
 *   020000-029999  Receivables (Forderungen)
 *   030000-039999  Liabilities (Verbindlichkeiten)
 *   040000-049999  Revenue (Umsatzerlöse)
 *   050000-059999  Cost of goods sold (Wareneinsatz)
 *   060000-069999  Personnel expenses (Personalaufwand)
 *   070000-079999  Operating expenses (Betriebliche Aufwendungen)
 *   080000-089999  Tax & other (Steuern & Sonstiges)
 *   090000-099999  Bank & cash (Bank/Kasse)
 */

export interface AccountRange {
  from: string;
  to: string;
  category: string;
}

export const ACCOUNT_RANGES: AccountRange[] = [
  { from: "010000", to: "019999", category: "Assets" },
  { from: "020000", to: "029999", category: "Receivables" },
  { from: "030000", to: "039999", category: "Liabilities" },
  { from: "040000", to: "049999", category: "Revenue" },
  { from: "050000", to: "059999", category: "Cost of goods sold" },
  { from: "060000", to: "069999", category: "Personnel expenses" },
  { from: "070000", to: "079999", category: "Operating expenses" },
  { from: "080000", to: "089999", category: "Tax & other" },
  { from: "090000", to: "099999", category: "Bank & cash" },
];

export interface GlAccount {
  number: string;
  name: string;
  category: string;
}

export const GL_ACCOUNTS: GlAccount[] = [
  // Assets (010000-019999)
  { number: "010000", name: "Grundstücke", category: "Assets" },
  { number: "010100", name: "Gebäude", category: "Assets" },
  { number: "010200", name: "Maschinen", category: "Assets" },
  {
    number: "010300",
    name: "Betriebs- und Geschäftsausstattung",
    category: "Assets",
  },

  // Receivables (020000-029999)
  {
    number: "020000",
    name: "Forderungen aus Lieferungen und Leistungen",
    category: "Receivables",
  },
  { number: "020100", name: "Sonstige Forderungen", category: "Receivables" },
  { number: "020200", name: "Vorsteuer", category: "Receivables" },

  // Liabilities (030000-039999)
  {
    number: "030000",
    name: "Verbindlichkeiten aus Lieferungen und Leistungen",
    category: "Liabilities",
  },
  {
    number: "030100",
    name: "Sonstige Verbindlichkeiten",
    category: "Liabilities",
  },
  { number: "030200", name: "Umsatzsteuer", category: "Liabilities" },
  {
    number: "030300",
    name: "Lohnsteuerverbindlichkeiten",
    category: "Liabilities",
  },
  {
    number: "030400",
    name: "Sozialversicherungsverbindlichkeiten",
    category: "Liabilities",
  },

  // Revenue (040000-049999)
  { number: "040000", name: "Umsatzerlöse Inland", category: "Revenue" },
  { number: "040100", name: "Umsatzerlöse Export", category: "Revenue" },
  {
    number: "040200",
    name: "Sonstige betriebliche Erträge",
    category: "Revenue",
  },

  // Cost of goods sold (050000-059999)
  { number: "050000", name: "Wareneinsatz", category: "Cost of goods sold" },
  {
    number: "050100",
    name: "Bezugsnebenkosten",
    category: "Cost of goods sold",
  },
  { number: "050200", name: "Fremdleistungen", category: "Cost of goods sold" },

  // Personnel expenses (060000-069999)
  { number: "060000", name: "Gehälter", category: "Personnel expenses" },
  { number: "060100", name: "Löhne", category: "Personnel expenses" },
  { number: "060200", name: "Soziale Abgaben", category: "Personnel expenses" },
  {
    number: "060300",
    name: "Sonstige Personalkosten",
    category: "Personnel expenses",
  },

  // Operating expenses (070000-079999)
  { number: "070000", name: "Miete", category: "Operating expenses" },
  { number: "070100", name: "Energiekosten", category: "Operating expenses" },
  { number: "070200", name: "Telefonkosten", category: "Operating expenses" },
  { number: "070300", name: "Büromaterial", category: "Operating expenses" },
  { number: "070400", name: "Versicherungen", category: "Operating expenses" },
  { number: "070500", name: "Reisekosten", category: "Operating expenses" },
  { number: "070600", name: "Werbekosten", category: "Operating expenses" },
  { number: "070700", name: "Instandhaltung", category: "Operating expenses" },
  {
    number: "070800",
    name: "Porto und Versand",
    category: "Operating expenses",
  },
  {
    number: "070900",
    name: "Rechts- und Beratungskosten",
    category: "Operating expenses",
  },
  { number: "071000", name: "Abschreibungen", category: "Operating expenses" },
  { number: "071100", name: "IT-Kosten", category: "Operating expenses" },

  // Tax & other (080000-089999)
  { number: "080000", name: "Gewerbesteuer", category: "Tax & other" },
  { number: "080100", name: "Körperschaftsteuer", category: "Tax & other" },

  // Bank & cash (090000-099999)
  { number: "090000", name: "Bank Hauptkonto", category: "Bank & cash" },
  { number: "090100", name: "Bank Nebenkonto", category: "Bank & cash" },
  { number: "090200", name: "Kasse", category: "Bank & cash" },
];

export function lookupAccountName(glAccount: string): string | null {
  return GL_ACCOUNTS.find((a) => a.number === glAccount)?.name ?? null;
}

export interface CostCenter {
  id: string;
  name: string;
}

export const COST_CENTERS: CostCenter[] = [
  { id: "1000", name: "Administration" },
  { id: "2000", name: "Sales" },
  { id: "3000", name: "Production" },
  { id: "4000", name: "IT" },
  { id: "5000", name: "Management" },
];

export function lookupCostCenterName(costCenter: string | null): string | null {
  if (!costCenter) return null;
  return COST_CENTERS.find((c) => c.id === costCenter)?.name ?? null;
}

export interface DocumentType {
  code: string;
  name: string;
}

export const DOCUMENT_TYPES: DocumentType[] = [
  { code: "KR", name: "Kreditorenrechnung (Vendor Invoice)" },
  { code: "DR", name: "Debitorenrechnung (Customer Invoice)" },
  { code: "KZ", name: "Kreditorenzahlung (Vendor Payment)" },
  { code: "DZ", name: "Debitorenzahlung (Customer Payment)" },
  { code: "SA", name: "Sachkontenbeleg (GL Posting)" },
  { code: "AB", name: "Ausgleichsbeleg (Clearing)" },
];
