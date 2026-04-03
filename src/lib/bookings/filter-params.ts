import type {
  BookingFilters,
  BookingStatus,
  FlagType,
  SortableColumn,
} from "./booking.types";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "./booking-queries";

const VALID_STATUSES: BookingStatus[] = ["critical", "warning", "clean"];
const VALID_FLAG_TYPES: FlagType[] = [
  "duplicate_booking",
  "missing_counterpart",
  "unusual_amount",
  "pattern_break",
  "round_number_anomaly",
  "text_typo",
  "unusual_text_account",
  "text_duplicate_posting",
];
const VALID_SORT_COLUMNS: SortableColumn[] = [
  "date",
  "documentId",
  "description",
  "account",
  "amount",
  "status",
];

const DEFAULTS: BookingFilters = {
  search: null,
  status: null,
  flagTypes: [],
  account: null,
  amountMin: null,
  amountMax: null,
  dateFrom: null,
  dateTo: null,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  sort: "date",
  sortDirection: "desc",
};

function getString(
  raw: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const value = raw[key];
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  return null;
}

function getNumber(
  raw: Record<string, string | string[] | undefined>,
  key: string,
): number | null {
  const str = getString(raw, key);
  if (str === null) return null;
  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}

/** Parse raw searchParams into typed BookingFilters with defaults */
export function parseBookingFilters(
  raw: Record<string, string | string[] | undefined>,
): BookingFilters {
  const status = getString(raw, "status");
  const sort = getString(raw, "sort");
  const dir = getString(raw, "dir");

  const flagsStr = getString(raw, "flags");
  const flagTypes: FlagType[] = flagsStr
    ? flagsStr
        .split(",")
        .filter((f): f is FlagType => VALID_FLAG_TYPES.includes(f as FlagType))
    : [];

  const rawPageSize = getNumber(raw, "pageSize");
  const pageSize =
    rawPageSize &&
    PAGE_SIZE_OPTIONS.includes(
      rawPageSize as (typeof PAGE_SIZE_OPTIONS)[number],
    )
      ? rawPageSize
      : DEFAULTS.pageSize;

  return {
    search: getString(raw, "search"),
    status:
      status && VALID_STATUSES.includes(status as BookingStatus)
        ? (status as BookingStatus)
        : null,
    flagTypes,
    account: getString(raw, "account"),
    amountMin: getNumber(raw, "amountMin"),
    amountMax: getNumber(raw, "amountMax"),
    dateFrom: getString(raw, "dateFrom"),
    dateTo: getString(raw, "dateTo"),
    page: getNumber(raw, "page") ?? DEFAULTS.page,
    pageSize,
    sort:
      sort && VALID_SORT_COLUMNS.includes(sort as SortableColumn)
        ? (sort as SortableColumn)
        : DEFAULTS.sort,
    sortDirection:
      dir === "asc" || dir === "desc" ? dir : DEFAULTS.sortDirection,
  };
}

/** Serialize BookingFilters back to URLSearchParams (omitting defaults) */
export function serializeBookingFilters(
  filters: Partial<BookingFilters>,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.flagTypes && filters.flagTypes.length > 0) {
    params.set("flags", filters.flagTypes.join(","));
  }
  if (filters.account) params.set("account", filters.account);
  if (filters.amountMin !== null && filters.amountMin !== undefined) {
    params.set("amountMin", String(filters.amountMin));
  }
  if (filters.amountMax !== null && filters.amountMax !== undefined) {
    params.set("amountMax", String(filters.amountMax));
  }
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.page && filters.page !== DEFAULTS.page) {
    params.set("page", String(filters.page));
  }
  if (filters.pageSize && filters.pageSize !== DEFAULTS.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }
  if (filters.sort && filters.sort !== DEFAULTS.sort) {
    params.set("sort", filters.sort);
  }
  if (
    filters.sortDirection &&
    filters.sortDirection !== DEFAULTS.sortDirection
  ) {
    params.set("dir", filters.sortDirection);
  }

  return params;
}

/** Produce a pathname + search string for navigation */
export function bookingListUrl(filters: Partial<BookingFilters>): string {
  const params = serializeBookingFilters(filters);
  const search = params.toString();
  return search ? `/bookings?${search}` : "/bookings";
}
