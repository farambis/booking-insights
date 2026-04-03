export type RuleCategory =
  | "account_tax_code"
  | "account_cost_center"
  | "document_type_account"
  | "recurring_text"
  | "amount_range";

export interface BookingRule {
  id: string;
  title: string;
  description: string;
  category: RuleCategory;
  confidence: number; // 0-1
  supportCount: number;
  totalEvaluated: number;
  supportRatio: number;
  evidence: RuleEvidence[];
  violationCount: number;
  scope: RuleScope;
}

export interface RuleEvidence {
  documentId: string;
  postingDate: string;
  bookingText: string;
  glAccount: string;
  glAccountName: string | null;
  amount: number;
  note: string;
}

export interface RuleScope {
  glAccount?: string;
  taxCode?: string;
  costCenter?: string;
  documentType?: string;
  accountRange?: string;
  textPattern?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface BookingManual {
  rules: BookingRule[];
  generatedAt: string;
  datasetSize: number;
}
