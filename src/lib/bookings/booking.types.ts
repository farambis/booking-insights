/** Flag severity levels */
export type FlagSeverity = "critical" | "warning";

/** Flag type identifiers (snake_case for storage, display labels are separate) */
export type FlagType =
  | "duplicate_booking"
  | "missing_counterpart"
  | "unusual_amount"
  | "pattern_break"
  | "round_number_anomaly"
  | "text_typo"
  | "unusual_text_account"
  | "text_duplicate_posting";

/** A detected flag on a booking */
export interface BookingFlag {
  type: FlagType;
  severity: FlagSeverity;
  explanation: string;
  confidence: number; // 0-1, mapped to "high"/"medium"/"low" at display time
  detectedAt: string; // ISO date
  relatedDocumentId: string | null;
}

/** Status derived from flags */
export type BookingStatus = "critical" | "warning" | "clean";

/** A single booking as displayed in the list view */
export interface BookingListItem {
  documentId: string;
  postingDate: string; // ISO date
  description: string;
  glAccount: string;
  glAccountName: string | null;
  contraAccount: string | null;
  contraAccountName: string | null;
  amount: number; // Signed: positive for debit, negative for credit
  currency: string;
  status: BookingStatus;
  flags: BookingFlag[];
  documentType: string;
}

/** Full booking detail (extends list item with additional context) */
export interface BookingDetail extends BookingListItem {
  lineId: number;
  companyCode: string;
  costCenter: string | null;
  costCenterName: string | null;
  bookingText: string;
  vendorId: string | null;
  customerId: string | null;
  taxCode: string | null;
  debitCredit: "S" | "H";
  documentLines: DocumentLine[];
}

/** A single line in a journal entry document */
export interface DocumentLine {
  lineId: number;
  glAccount: string;
  glAccountName: string | null;
  amount: number;
  debitCredit: "S" | "H";
  costCenter: string | null;
}

/** Filters that map to URL search params */
export interface BookingFilters {
  search: string | null;
  status: BookingStatus | null;
  flagTypes: FlagType[];
  account: string | null;
  amountMin: number | null;
  amountMax: number | null;
  dateFrom: string | null; // ISO date
  dateTo: string | null; // ISO date
  page: number;
  pageSize: number;
  sort: SortableColumn;
  sortDirection: "asc" | "desc";
}

export type SortableColumn =
  | "date"
  | "documentId"
  | "description"
  | "account"
  | "amount"
  | "status";

/** Dashboard summary data -- all values derived from journal entries + flag engine */
export interface DashboardSummary {
  totalDocuments: number;
  totalLines: number;
  criticalCount: number;
  warningCount: number;
  cleanCount: number;
  cleanPercent: number;
  flagDistribution: { type: FlagType; label: string; count: number }[];
  topFlaggedAccounts: {
    account: string;
    accountName: string | null;
    flagCount: number;
  }[];
  activityByDate: {
    date: string;
    totalCount: number;
    flaggedCount: number;
  }[];
  recentCritical: BookingListItem[];
}

/** Related bookings context for detail view */
export interface BookingRelatedContext {
  possibleDuplicate: BookingListItem | null;
  sameAccountRecent: BookingListItem[];
  accountSummary: {
    account: string;
    accountName: string | null;
    totalBookings: number;
    flaggedCount: number;
    flaggedPercent: number;
    averageAmount: number;
    currentAmount: number;
    vsAverage: { percent: number; severity: "normal" | "elevated" | "high" };
  };
}

/** Paginated result wrapper */
export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
