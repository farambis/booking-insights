import { notFound } from "next/navigation";
import Link from "next/link";
import { bookingService } from "@/lib/bookings";
import { formatDateCompact, flagTypeLabel } from "@/lib/bookings/format";
import { StatusBadge } from "@/components/status-badge";
import { BookingDataTable } from "@/components/booking-data-table";
import { FlagExplanationCard } from "@/components/flag-explanation-card";
import { RelatedBookings } from "@/components/related-bookings";
import { AccountSummary } from "@/components/account-summary";
import { DocumentLinesTable } from "@/components/document-lines-table";

export default async function BookingDetailPage(props: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await props.params;

  const [booking, relatedContext] = await Promise.all([
    bookingService.getBookingDetail(documentId),
    bookingService.getRelatedContext(documentId),
  ]);

  if (!booking) {
    notFound();
  }

  return (
    <div>
      {/* Back navigation */}
      <Link
        href="/bookings"
        className="mb-4 inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900"
      >
        &larr; Back to Bookings
      </Link>

      {/* Status header */}
      <div className="mb-6 border-b border-neutral-200 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              {booking.documentId}
              <span className="ml-2 text-lg font-normal text-neutral-500">
                &mdash; {booking.description}
              </span>
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {formatDateCompact(booking.postingDate)}
            </p>
          </div>
          <StatusBadge status={booking.status} size="large" />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left column (60%) */}
        <div className="space-y-6 lg:col-span-3">
          <BookingDataTable booking={booking} />

          {booking.flags.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-neutral-900">
                Why was this flagged?
              </h2>
              <div className="space-y-3">
                {booking.flags.map((flag, index) => (
                  <FlagExplanationCard
                    key={`${flag.type}-${index}`}
                    flag={{
                      type: flag.type,
                      label: flagTypeLabel(flag.type),
                      explanation: flag.explanation,
                      confidencePercent: Math.round(flag.confidence * 100),
                      relatedDocumentId: flag.relatedDocumentId,
                    }}
                    severity={flag.severity}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column (40%) */}
        <div className="space-y-6 lg:col-span-2">
          <RelatedBookings
            possibleDuplicate={relatedContext.possibleDuplicate}
            sameAccountRecent={relatedContext.sameAccountRecent}
            account={relatedContext.accountSummary.account}
          />
          <AccountSummary summary={relatedContext.accountSummary} />
        </div>
      </div>

      {/* Document lines (full width) */}
      <div className="mt-6">
        <DocumentLinesTable
          lines={booking.documentLines}
          documentId={booking.documentId}
        />
      </div>
    </div>
  );
}
