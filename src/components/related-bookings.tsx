import Link from "next/link";
import type { BookingListItem } from "@/lib/bookings/booking.types";
import { RelatedBookingCard } from "@/components/related-booking-card";

interface RelatedBookingsProps {
  possibleDuplicate: BookingListItem | null;
  sameAccountRecent: BookingListItem[];
  account: string;
}

export function RelatedBookings({
  possibleDuplicate,
  sameAccountRecent,
  account,
}: RelatedBookingsProps) {
  const displayedRecent = sameAccountRecent.slice(0, 3);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900">
        Related Bookings
      </h3>

      {possibleDuplicate && (
        <div className="mt-3">
          <span className="text-critical text-xs font-semibold tracking-wide uppercase">
            Possible Duplicate
          </span>
          <div className="mt-1">
            <RelatedBookingCard booking={possibleDuplicate} />
          </div>
        </div>
      )}

      {displayedRecent.length > 0 && (
        <div className="mt-4">
          <span className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Same Account
          </span>
          <div className="mt-1 space-y-2">
            {displayedRecent.map((booking) => (
              <RelatedBookingCard key={booking.documentId} booking={booking} />
            ))}
          </div>
          {sameAccountRecent.length > 3 && (
            <div className="mt-2">
              <Link
                href={`/bookings?account=${account}`}
                className="text-brand text-xs font-medium hover:underline"
              >
                Show all on {account} &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {!possibleDuplicate && displayedRecent.length === 0 && (
        <p className="mt-3 text-xs text-neutral-500">
          No related bookings found.
        </p>
      )}
    </div>
  );
}
