import Link from "next/link";
import type { BookingListItem } from "@/lib/bookings/booking.types";
import { formatAmount, formatDateCompact } from "@/lib/bookings/format";
import { StatusBadge } from "@/components/status-badge";

interface RelatedBookingCardProps {
  booking: BookingListItem;
}

export function RelatedBookingCard({ booking }: RelatedBookingCardProps) {
  return (
    <Link
      href={`/bookings/${booking.documentId}`}
      className="block rounded-md border border-neutral-200 p-3 transition-colors hover:bg-neutral-50"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-medium text-neutral-900">
          {booking.documentId}
        </span>
        {booking.status !== "clean" && <StatusBadge status={booking.status} />}
      </div>
      <p className="mt-1 truncate text-xs text-neutral-500">
        {booking.description}
      </p>
      <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
        <span>{formatDateCompact(booking.postingDate)}</span>
        <span>&middot;</span>
        <span className="tabular-nums">
          {formatAmount(Math.abs(booking.amount), booking.currency)}
        </span>
      </div>
    </Link>
  );
}
