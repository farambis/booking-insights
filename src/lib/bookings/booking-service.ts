import type {
  BookingDetail,
  BookingFilters,
  BookingListItem,
  BookingRelatedContext,
  DashboardSummary,
  PaginatedResult,
} from "./booking.types";
import type { BookingManual } from "./rule.types";

export interface BookingService {
  getDashboardSummary(): Promise<DashboardSummary>;
  getBookings(
    filters: BookingFilters,
  ): Promise<PaginatedResult<BookingListItem>>;
  /** Returns full detail including all document lines (for the double-entry view) */
  getBookingDetail(documentId: string): Promise<BookingDetail | null>;
  getRelatedContext(documentId: string): Promise<BookingRelatedContext>;
  getBookingManual(): Promise<BookingManual>;
}
