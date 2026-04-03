import type {
  BookingDetail,
  BookingFilters,
  BookingListItem,
  BookingRelatedContext,
  DashboardSummary,
  FlagType,
  PaginatedResult,
  SortableColumn,
} from "./booking.types";
import { flagTypeLabel } from "./format";

export const DEFAULT_PAGE_SIZE = 50;
export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

const STATUS_PRIORITY: Record<string, number> = {
  critical: 0,
  warning: 1,
  clean: 2,
};

function matchesSearch(booking: BookingListItem, search: string): boolean {
  const lower = search.toLowerCase();
  return (
    booking.documentId.toLowerCase().includes(lower) ||
    booking.description.toLowerCase().includes(lower) ||
    booking.glAccount.toLowerCase().includes(lower) ||
    (booking.glAccountName?.toLowerCase().includes(lower) ?? false) ||
    (booking.contraAccount?.toLowerCase().includes(lower) ?? false) ||
    (booking.contraAccountName?.toLowerCase().includes(lower) ?? false)
  );
}

function applyFilters(
  bookings: BookingListItem[],
  filters: BookingFilters,
): BookingListItem[] {
  let result = bookings;

  if (filters.search) {
    const search = filters.search;
    result = result.filter((b) => matchesSearch(b, search));
  }

  if (filters.status) {
    const status = filters.status;
    result = result.filter((b) => b.status === status);
  }

  if (filters.flagTypes.length > 0) {
    const flagTypes = new Set(filters.flagTypes);
    result = result.filter((b) => b.flags.some((f) => flagTypes.has(f.type)));
  }

  if (filters.account) {
    const account = filters.account;
    result = result.filter(
      (b) => b.glAccount === account || b.contraAccount === account,
    );
  }

  if (filters.amountMin !== null) {
    const min = filters.amountMin;
    result = result.filter((b) => Math.abs(b.amount) >= min);
  }

  if (filters.amountMax !== null) {
    const max = filters.amountMax;
    result = result.filter((b) => Math.abs(b.amount) <= max);
  }

  if (filters.dateFrom) {
    const from = filters.dateFrom;
    result = result.filter((b) => b.postingDate >= from);
  }

  if (filters.dateTo) {
    const to = filters.dateTo;
    result = result.filter((b) => b.postingDate <= to);
  }

  return result;
}

function sortBookings(
  bookings: BookingListItem[],
  sort: SortableColumn,
  direction: "asc" | "desc",
): BookingListItem[] {
  const sorted = [...bookings];
  const dir = direction === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    switch (sort) {
      case "date":
        return dir * a.postingDate.localeCompare(b.postingDate);
      case "documentId":
        return dir * a.documentId.localeCompare(b.documentId);
      case "description":
        return dir * a.description.localeCompare(b.description);
      case "account":
        return dir * a.glAccount.localeCompare(b.glAccount);
      case "amount":
        return dir * (Math.abs(a.amount) - Math.abs(b.amount));
      case "status":
        return (
          dir *
          ((STATUS_PRIORITY[a.status] ?? 2) - (STATUS_PRIORITY[b.status] ?? 2))
        );
      default:
        return 0;
    }
  });

  return sorted;
}

/** Filter, sort, and paginate bookings */
export function queryBookings(
  bookings: BookingListItem[],
  filters: BookingFilters,
): PaginatedResult<BookingListItem> {
  const filtered = applyFilters(bookings, filters);
  const sorted = sortBookings(filtered, filters.sort, filters.sortDirection);

  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const totalCount = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(Math.max(1, filters.page), totalPages);
  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/** Build dashboard summary from all bookings */
export function buildDashboardSummary(
  bookings: BookingDetail[],
): DashboardSummary {
  const totalDocuments = bookings.length;

  let totalLines = 0;
  for (const b of bookings) {
    totalLines += b.documentLines.length;
  }

  const criticalCount = bookings.filter((b) => b.status === "critical").length;
  const warningCount = bookings.filter((b) => b.status === "warning").length;
  const cleanCount = bookings.filter((b) => b.status === "clean").length;
  const cleanPercent =
    totalDocuments > 0
      ? Math.round((cleanCount / totalDocuments) * 1000) / 10
      : 0;

  // Flag distribution
  const flagCounts = new Map<FlagType, number>();
  for (const b of bookings) {
    const seenTypes = new Set<FlagType>();
    for (const f of b.flags) {
      if (!seenTypes.has(f.type)) {
        seenTypes.add(f.type);
        flagCounts.set(f.type, (flagCounts.get(f.type) ?? 0) + 1);
      }
    }
  }

  const flagDistribution = Array.from(flagCounts.entries())
    .map(([type, count]) => ({
      type,
      label: flagTypeLabel(type),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Top flagged accounts
  const accountFlagCounts = new Map<string, number>();
  for (const b of bookings) {
    if (b.flags.length > 0) {
      accountFlagCounts.set(
        b.glAccount,
        (accountFlagCounts.get(b.glAccount) ?? 0) + 1,
      );
    }
  }

  const topFlaggedAccounts = Array.from(accountFlagCounts.entries())
    .map(([account, flagCount]) => ({
      account,
      accountName:
        bookings.find((b) => b.glAccount === account)?.glAccountName ?? null,
      flagCount,
    }))
    .sort((a, b) => b.flagCount - a.flagCount)
    .slice(0, 5);

  // Activity by date
  const dateMap = new Map<
    string,
    { totalCount: number; flaggedCount: number }
  >();
  for (const b of bookings) {
    const entry = dateMap.get(b.postingDate) ?? {
      totalCount: 0,
      flaggedCount: 0,
    };
    entry.totalCount++;
    if (b.flags.length > 0) entry.flaggedCount++;
    dateMap.set(b.postingDate, entry);
  }

  const activityByDate = Array.from(dateMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Recent critical
  const recentCritical = bookings
    .filter((b) => b.status === "critical")
    .sort((a, b) => b.postingDate.localeCompare(a.postingDate))
    .slice(0, 5);

  return {
    totalDocuments,
    totalLines,
    criticalCount,
    warningCount,
    cleanCount,
    cleanPercent,
    flagDistribution,
    topFlaggedAccounts,
    activityByDate,
    recentCritical,
  };
}

/** Find related bookings for a given document */
export function findRelated(
  bookings: BookingListItem[],
  documentId: string,
): BookingRelatedContext {
  const current = bookings.find((b) => b.documentId === documentId);

  if (!current) {
    return {
      possibleDuplicate: null,
      sameAccountRecent: [],
      accountSummary: {
        account: "",
        accountName: null,
        totalBookings: 0,
        flaggedCount: 0,
        flaggedPercent: 0,
        averageAmount: 0,
        currentAmount: 0,
        vsAverage: { percent: 0, severity: "normal" },
      },
    };
  }

  // Possible duplicate: check if any flag references another document
  const dupFlag = current.flags.find(
    (f) =>
      (f.type === "duplicate_entry" || f.type === "duplicate_booking") &&
      f.relatedDocumentId,
  );
  const possibleDuplicate = dupFlag?.relatedDocumentId
    ? (bookings.find((b) => b.documentId === dupFlag.relatedDocumentId) ?? null)
    : null;

  // Same account recent (excluding self), last 5 by date
  const sameAccountRecent = bookings
    .filter(
      (b) => b.glAccount === current.glAccount && b.documentId !== documentId,
    )
    .sort((a, b) => b.postingDate.localeCompare(a.postingDate))
    .slice(0, 5);

  // Account summary
  const sameAccount = bookings.filter((b) => b.glAccount === current.glAccount);
  const totalBookings = sameAccount.length;
  const flaggedCount = sameAccount.filter((b) => b.flags.length > 0).length;
  const flaggedPercent =
    totalBookings > 0
      ? Math.round((flaggedCount / totalBookings) * 1000) / 10
      : 0;
  const amounts = sameAccount.map((b) => Math.abs(b.amount));
  const averageAmount =
    amounts.length > 0
      ? amounts.reduce((s, a) => s + a, 0) / amounts.length
      : 0;
  const currentAmount = Math.abs(current.amount);
  const vsAveragePercent =
    averageAmount > 0
      ? Math.round(((currentAmount - averageAmount) / averageAmount) * 100)
      : 0;

  let severity: "normal" | "elevated" | "high" = "normal";
  if (Math.abs(vsAveragePercent) > 100) severity = "high";
  else if (Math.abs(vsAveragePercent) > 50) severity = "elevated";

  return {
    possibleDuplicate,
    sameAccountRecent,
    accountSummary: {
      account: current.glAccount,
      accountName: current.glAccountName,
      totalBookings,
      flaggedCount,
      flaggedPercent,
      averageAmount,
      currentAmount,
      vsAverage: { percent: vsAveragePercent, severity },
    },
  };
}
