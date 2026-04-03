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

  // Build a lookup of related documents for inline display in flag cards
  const relatedDocIds = new Set(
    booking.flags
      .map((f) => f.relatedDocumentId)
      .filter((id): id is string => id !== null),
  );
  const relatedDocMap = new Map<
    string,
    {
      documentId: string;
      description: string;
      postingDate: string;
      amount: number;
      currency: string;
      glAccount: string;
      glAccountName: string | null;
    }
  >();
  for (const docId of relatedDocIds) {
    const doc = await bookingService.getBookingDetail(docId);
    if (doc) {
      relatedDocMap.set(docId, {
        documentId: doc.documentId,
        description: doc.description,
        postingDate: doc.postingDate,
        amount: doc.amount,
        currency: doc.currency,
        glAccount: doc.glAccount,
        glAccountName: doc.glAccountName,
      });
    }
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

          {booking.flags.length === 0 && (
            <div className="border-clean-border bg-clean-bg rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="text-clean h-5 w-5"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M5 8l2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-clean text-sm font-semibold">
                  No flags detected
                </span>
              </div>
              <p className="mt-1 pl-7 text-sm text-neutral-600">
                This document passed all checks.
              </p>
            </div>
          )}

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
                    relatedDocument={
                      flag.relatedDocumentId
                        ? (relatedDocMap.get(flag.relatedDocumentId) ?? null)
                        : null
                    }
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
