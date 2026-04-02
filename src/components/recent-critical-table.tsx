import Link from "next/link";
import type { BookingListItem } from "@/lib/bookings/booking.types";
import {
  formatDateCompact,
  formatAmount,
  flagTypeLabel,
} from "@/lib/bookings/format";

interface RecentCriticalTableProps {
  bookings: BookingListItem[];
}

export function RecentCriticalTable({ bookings }: RecentCriticalTableProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          Recent Critical Flags
        </h2>
        <Link
          href="/bookings?status=critical"
          className="text-brand hover:text-brand-dim text-xs font-medium"
        >
          View all &rarr;
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs font-medium text-neutral-500">
              <th className="px-5 py-2">Date</th>
              <th className="px-3 py-2">Document</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Account</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2">Flag</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr
                key={booking.documentId}
                className="bg-critical-bg/80 hover:bg-critical-bg border-b border-neutral-100 last:border-b-0"
              >
                <td className="px-5 py-2.5 text-neutral-700">
                  <Link href={`/bookings/${booking.documentId}`}>
                    {formatDateCompact(booking.postingDate)}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/bookings/${booking.documentId}`}
                    className="hover:text-brand font-mono text-neutral-900"
                  >
                    {booking.documentId}
                  </Link>
                </td>
                <td className="max-w-[200px] truncate px-3 py-2.5 text-neutral-700">
                  {booking.description}
                </td>
                <td className="px-3 py-2.5 font-mono text-neutral-700">
                  {booking.glAccount}
                </td>
                <td className="px-3 py-2.5 text-right text-neutral-900 tabular-nums">
                  {formatAmount(booking.amount, booking.currency)}
                </td>
                <td className="text-critical px-3 py-2.5 text-xs">
                  {booking.flags[0] ? flagTypeLabel(booking.flags[0].type) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
