"use client";

import Link from "next/link";
import type {
  BookingListItem,
  BookingStatus,
  SortableColumn,
} from "@/lib/bookings";
import {
  formatAmount,
  formatDateCompact,
  flagTypeShortLabel,
} from "@/lib/bookings/format";
import { StatusBadge } from "@/components/status-badge";

interface BookingTableProps {
  bookings: BookingListItem[];
  currentSort: { column: SortableColumn; direction: "asc" | "desc" };
  sortUrls: Record<SortableColumn, string>;
  baseDetailUrl: string;
}

const ROW_STYLES: Record<BookingStatus, string> = {
  critical:
    "bg-critical-bg/80 border-l-[3px] border-l-critical hover:bg-critical-bg",
  warning:
    "bg-warning-bg/60 border-l-[3px] border-l-warning hover:bg-warning-bg",
  clean: "hover:bg-neutral-50",
};

const STATUS_INDICATOR: Record<BookingStatus, React.ReactNode> = {
  critical: <span className="text-critical">&#9679;</span>,
  warning: <span className="text-warning">&#9680;</span>,
  clean: null,
};

interface ColumnDef {
  key: SortableColumn;
  label: string;
  align: "left" | "right" | "center";
  width: string;
}

const COLUMNS: ColumnDef[] = [
  { key: "date", label: "Date", align: "left", width: "w-[110px]" },
  { key: "documentId", label: "Doc Nr", align: "left", width: "w-[100px]" },
  {
    key: "description",
    label: "Description",
    align: "left",
    width: "min-w-[200px]",
  },
  { key: "account", label: "Account", align: "left", width: "w-[100px]" },
  { key: "amount", label: "Amount", align: "right", width: "w-[150px]" },
  { key: "status", label: "Status", align: "left", width: "w-[140px]" },
];

const ALIGN_CLASSES: Record<string, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function BookingTable({
  bookings,
  currentSort,
  sortUrls,
  baseDetailUrl,
}: BookingTableProps) {
  function sortIndicator(column: SortableColumn): string {
    if (column !== currentSort.column) return "";
    return currentSort.direction === "asc" ? " \u2191" : " \u2193";
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-neutral-50">
          <tr className="border-b border-neutral-200">
            <th className="w-10 px-3 py-3" />
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`${col.width} px-3 py-3 font-medium text-neutral-500 ${ALIGN_CLASSES[col.align]}`}
              >
                <Link
                  href={sortUrls[col.key]}
                  className="select-none hover:text-neutral-900"
                >
                  {col.label}
                  {sortIndicator(col.key)}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr
              key={booking.documentId}
              className={`border-b border-neutral-100 transition-colors ${ROW_STYLES[booking.status]}`}
            >
              <td className="px-3 py-2.5 text-center">
                {STATUS_INDICATOR[booking.status]}
              </td>
              <td className="px-3 py-2.5 text-left">
                <Link
                  href={`${baseDetailUrl}/${booking.documentId}`}
                  className="hover:text-brand"
                >
                  {formatDateCompact(booking.postingDate)}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-left font-mono text-xs">
                <Link
                  href={`${baseDetailUrl}/${booking.documentId}`}
                  className="hover:text-brand"
                >
                  {booking.documentId}
                </Link>
              </td>
              <td className="max-w-[300px] truncate px-3 py-2.5 text-left">
                <Link
                  href={`${baseDetailUrl}/${booking.documentId}`}
                  className="hover:text-brand block truncate"
                >
                  {booking.description}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-left font-mono text-xs">
                {booking.glAccount}
              </td>
              <td
                className={`px-3 py-2.5 text-right tabular-nums ${
                  booking.amount < 0
                    ? "text-critical"
                    : booking.amount === 0
                      ? "text-neutral-400"
                      : ""
                }`}
              >
                {formatAmount(booking.amount, booking.currency)}
              </td>
              <td className="px-3 py-2.5 text-left">
                {booking.status !== "clean" && (
                  <span className="flex items-center gap-1.5">
                    <StatusBadge status={booking.status} />
                    <span className="text-xs text-neutral-500">
                      {flagTypeShortLabel(booking.flags[0].type)}
                      {booking.flags.length > 1 &&
                        ` +${booking.flags.length - 1}`}
                    </span>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
