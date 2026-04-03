import { notFound } from "next/navigation";
import Link from "next/link";
import { bookingService } from "@/lib/bookings";
import type { BookingListItem, SortableColumn } from "@/lib/bookings";
import { PageHeader } from "@/components/page-header";
import { BookingTable } from "@/components/booking-table";
import { EmptyState } from "@/components/empty-state";

const SORTABLE_COLUMNS: SortableColumn[] = [
  "date",
  "documentId",
  "description",
  "account",
  "amount",
  "status",
];

const VALID_SORT_COLUMNS = new Set<string>(SORTABLE_COLUMNS);

const STATUS_ORDER: Record<string, number> = {
  critical: 0,
  warning: 1,
  clean: 2,
};

function sortViolations(
  violations: BookingListItem[],
  column: SortableColumn,
  direction: "asc" | "desc",
): BookingListItem[] {
  const sorted = [...violations].sort((a, b) => {
    let cmp = 0;
    switch (column) {
      case "date":
        cmp = a.postingDate.localeCompare(b.postingDate);
        break;
      case "documentId":
        cmp = a.documentId.localeCompare(b.documentId);
        break;
      case "description":
        cmp = a.description.localeCompare(b.description);
        break;
      case "account":
        cmp = a.glAccount.localeCompare(b.glAccount);
        break;
      case "amount":
        cmp = Math.abs(a.amount) - Math.abs(b.amount);
        break;
      case "status":
        cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
        break;
    }
    return direction === "asc" ? cmp : -cmp;
  });
  return sorted;
}

export default async function RuleViolationsPage(props: {
  params: Promise<{ ruleId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { ruleId } = await props.params;
  const searchParams = await props.searchParams;
  const result = await bookingService.getRuleViolations(
    decodeURIComponent(ruleId),
  );

  if (!result) notFound();

  const { rule, violations } = result;

  // Parse sort params from URL
  const rawSort =
    typeof searchParams.sort === "string" ? searchParams.sort : null;
  const rawDir = typeof searchParams.dir === "string" ? searchParams.dir : null;

  const currentColumn: SortableColumn =
    rawSort && VALID_SORT_COLUMNS.has(rawSort)
      ? (rawSort as SortableColumn)
      : "date";
  const currentDirection: "asc" | "desc" =
    rawDir === "asc" || rawDir === "desc" ? rawDir : "desc";

  const sortedViolations = sortViolations(
    violations,
    currentColumn,
    currentDirection,
  );

  // Build sort URLs with toggling behavior
  const basePath = `/manual/${encodeURIComponent(rule.id)}`;
  const sortUrls = Object.fromEntries(
    SORTABLE_COLUMNS.map((col) => {
      const newDirection =
        currentColumn === col && currentDirection === "asc"
          ? "desc"
          : currentColumn === col && currentDirection === "desc"
            ? "asc"
            : "asc";
      const params = new URLSearchParams();
      if (col !== "date") params.set("sort", col);
      if (newDirection !== "desc") params.set("dir", newDirection);
      const search = params.toString();
      return [col, search ? `${basePath}?${search}` : basePath];
    }),
  ) as Record<SortableColumn, string>;

  return (
    <>
      <div className="mb-4">
        <Link
          href="/manual"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          &larr; Back to Manual
        </Link>
      </div>

      <PageHeader
        title={rule.title}
        subtitle={`${violations.length} violation${violations.length !== 1 ? "s" : ""} found`}
      />

      <p className="mb-6 text-sm text-neutral-600">{rule.description}</p>

      {violations.length === 0 ? (
        <EmptyState
          heading="No violations"
          subtext="All bookings conform to this rule."
        />
      ) : (
        <BookingTable
          bookings={sortedViolations}
          currentSort={{ column: currentColumn, direction: currentDirection }}
          sortUrls={sortUrls}
          baseDetailUrl="/bookings"
        />
      )}
    </>
  );
}
