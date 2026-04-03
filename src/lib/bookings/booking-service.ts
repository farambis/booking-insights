import type {
  BookingDetail,
  BookingFilters,
  BookingListItem,
  BookingRelatedContext,
  DashboardSummary,
  PaginatedResult,
} from "./booking.types";
import type { BookingManual, BookingRule } from "./rule.types";

export interface BookingService {
  getDashboardSummary(): Promise<DashboardSummary>;
  getCounts(): Promise<{
    totalDocuments: number;
    criticalCount: number;
    warningCount: number;
    cleanCount: number;
  }>;
  getBookings(
    filters: BookingFilters,
  ): Promise<PaginatedResult<BookingListItem>>;
  /** Returns full detail including all document lines (for the double-entry view) */
  getBookingDetail(documentId: string): Promise<BookingDetail | null>;
  getRelatedContext(documentId: string): Promise<BookingRelatedContext>;
  getBookingManual(): Promise<BookingManual>;
  getRuleViolations(
    ruleId: string,
  ): Promise<{ rule: BookingRule; violations: BookingListItem[] } | null>;
}
