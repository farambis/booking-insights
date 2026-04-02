import { bookingService } from "@/lib/bookings";
import type { FlagType, SortableColumn } from "@/lib/bookings";
import { PAGE_SIZE_OPTIONS } from "@/lib/bookings/booking-queries";
import {
  parseBookingFilters,
  bookingListUrl,
} from "@/lib/bookings/filter-params";
import { flagTypeLabel } from "@/lib/bookings/format";
import { GL_ACCOUNTS } from "@/lib/data/account-master";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar/filter-bar";
import { BookingTable } from "@/components/booking-table";
import { Pagination } from "@/components/pagination";
import { ResultsSummary } from "@/components/results-summary";
import { EmptyState } from "@/components/empty-state";

const ALL_FLAG_TYPES: { id: FlagType; label: string }[] = [
  { id: "duplicate_entry", label: flagTypeLabel("duplicate_entry") },
  { id: "missing_counterpart", label: flagTypeLabel("missing_counterpart") },
  { id: "unusual_amount", label: flagTypeLabel("unusual_amount") },
  { id: "pattern_break", label: flagTypeLabel("pattern_break") },
  { id: "round_number_anomaly", label: flagTypeLabel("round_number_anomaly") },
];

const ACCOUNTS = GL_ACCOUNTS.map((a) => ({ number: a.number, name: a.name }));

const SORTABLE_COLUMNS: SortableColumn[] = [
  "date",
  "documentId",
  "description",
  "account",
  "amount",
  "status",
];

export default async function BookingsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const filters = parseBookingFilters(
    searchParams as Record<string, string | string[] | undefined>,
  );

  const [result, summary] = await Promise.all([
    bookingService.getBookings(filters),
    bookingService.getDashboardSummary(),
  ]);

  const totalDocuments = summary.totalDocuments;
  const flaggedCount = summary.criticalCount + summary.warningCount;

  // Pre-compute sort URLs for each column (serializable strings, no functions)
  const sortUrls = Object.fromEntries(
    SORTABLE_COLUMNS.map((col) => {
      const newDirection =
        filters.sort === col && filters.sortDirection === "asc"
          ? "desc"
          : filters.sort === col && filters.sortDirection === "desc"
            ? "asc"
            : "asc";
      return [
        col,
        bookingListUrl({
          ...filters,
          sort: col,
          sortDirection: newDirection,
          page: 1,
        }),
      ];
    }),
  ) as Record<SortableColumn, string>;

  // Pre-compute pagination URLs
  const prevUrl =
    result.page > 1
      ? bookingListUrl({ ...filters, page: result.page - 1 })
      : null;
  const nextUrl =
    result.page < result.totalPages
      ? bookingListUrl({ ...filters, page: result.page + 1 })
      : null;

  // Pre-compute page size URLs (reset to page 1 when changing page size)
  const pageSizeUrls = Object.fromEntries(
    PAGE_SIZE_OPTIONS.map((size) => [
      size,
      bookingListUrl({ ...filters, pageSize: size, page: 1 }),
    ]),
  ) as Record<number, string>;

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle={`${totalDocuments} documents \u2014 ${flaggedCount > 0 ? `${flaggedCount} flagged` : "no flags"}`}
      />
      <FilterBar
        accounts={ACCOUNTS}
        flagTypes={ALL_FLAG_TYPES}
        currentFilters={filters}
      />
      <ResultsSummary
        totalCount={totalDocuments}
        filteredCount={result.totalCount}
      />
      {result.items.length === 0 ? (
        <EmptyState
          heading="No bookings found"
          subtext="Try adjusting your filters to find what you are looking for."
        />
      ) : (
        <>
          <BookingTable
            bookings={result.items}
            currentSort={{
              column: filters.sort,
              direction: filters.sortDirection,
            }}
            sortUrls={sortUrls}
            baseDetailUrl="/bookings"
          />
          <Pagination
            currentPage={result.page}
            totalPages={result.totalPages}
            prevUrl={prevUrl}
            nextUrl={nextUrl}
            currentPageSize={result.pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            pageSizeUrls={pageSizeUrls}
          />
        </>
      )}
    </>
  );
}
