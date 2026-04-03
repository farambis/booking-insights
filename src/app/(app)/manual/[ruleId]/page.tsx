import { notFound } from "next/navigation";
import Link from "next/link";
import { bookingService } from "@/lib/bookings";
import type { SortableColumn } from "@/lib/bookings";
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

export default async function RuleViolationsPage(props: {
  params: Promise<{ ruleId: string }>;
}) {
  const { ruleId } = await props.params;
  const result = await bookingService.getRuleViolations(
    decodeURIComponent(ruleId),
  );

  if (!result) notFound();

  const { rule, violations } = result;

  // Static sort URLs that point back to the same page (no server-side sorting)
  const sortUrls = Object.fromEntries(
    SORTABLE_COLUMNS.map((col) => [
      col,
      `/manual/${encodeURIComponent(rule.id)}`,
    ]),
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
          bookings={violations}
          currentSort={{ column: "date", direction: "desc" }}
          sortUrls={sortUrls}
          baseDetailUrl="/bookings"
        />
      )}
    </>
  );
}
