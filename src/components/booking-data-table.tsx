import type { BookingDetail } from "@/lib/bookings/booking.types";
import {
  formatAmount,
  formatDateCompact,
  formatAccount,
  formatDocumentType,
  formatDebitCredit,
} from "@/lib/bookings/format";

interface BookingDataTableProps {
  booking: BookingDetail;
}

export function BookingDataTable({ booking }: BookingDataTableProps) {
  const rows: { label: string; value: string }[] = [
    { label: "Document ID", value: booking.documentId },
    { label: "Line", value: String(booking.lineId) },
    { label: "Posting Date", value: formatDateCompact(booking.postingDate) },
    { label: "Document Type", value: formatDocumentType(booking.documentType) },
    {
      label: "GL Account",
      value: formatAccount(booking.glAccount, booking.glAccountName),
    },
    {
      label: "Amount",
      value: `${formatAmount(Math.abs(booking.amount), booking.currency)} (${formatDebitCredit(booking.debitCredit)})`,
    },
    { label: "Tax Code", value: booking.taxCode ?? "\u2014" },
    {
      label: "Cost Center",
      value: booking.costCenter
        ? formatAccount(booking.costCenter, booking.costCenterName)
        : "\u2014",
    },
    {
      label: "Vendor/Customer",
      value: booking.vendorId ?? booking.customerId ?? "\u2014",
    },
    { label: "Booking Text", value: booking.bookingText },
    { label: "Company Code", value: booking.companyCode },
  ];

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-neutral-900">Booking Data</h3>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-neutral-100">
              <td className="w-40 px-4 py-2 font-medium text-neutral-500">
                {row.label}
              </td>
              <td className="px-4 py-2 text-neutral-900">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
