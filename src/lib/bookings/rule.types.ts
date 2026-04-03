export type RuleCategory =
  | "account_tax_code"
  | "account_cost_center"
  | "document_type_account"
  | "recurring_text"
  | "amount_range";

export type RuleScope =
  | AccountTaxCodeScope
  | AccountCostCenterScope
  | DocumentTypeAccountScope
  | RecurringTextScope
  | AmountRangeScope;

export interface AccountTaxCodeScope {
  category: "account_tax_code";
  glAccount: string;
  taxCode: string;
}

export interface AccountCostCenterScope {
  category: "account_cost_center";
  glAccount: string;
  costCenter: string;
}

export interface DocumentTypeAccountScope {
  category: "document_type_account";
  documentType: string;
  accountRange: string;
}

export interface RecurringTextScope {
  category: "recurring_text";
  textPattern: string;
  glAccount: string;
}

export interface AmountRangeScope {
  category: "amount_range";
  glAccount: string;
  amountMin: number;
  amountMax: number;
}

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

export interface BookingManual {
  rules: BookingRule[];
  generatedAt: string;
  datasetSize: number;
}
