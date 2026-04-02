import Link from "next/link";
import type { BookingRelatedContext } from "@/lib/bookings/booking.types";
import { formatAmount, formatAccount } from "@/lib/bookings/format";

type AccountSummaryData = BookingRelatedContext["accountSummary"];

interface AccountSummaryProps {
  summary: AccountSummaryData;
}

const VS_AVERAGE_STYLES: Record<string, string> = {
  normal: "text-clean",
  elevated: "text-warning",
  high: "text-critical",
};

export function AccountSummary({ summary }: AccountSummaryProps) {
  const vsSign = summary.vsAverage.percent >= 0 ? "+" : "";
  const vsLabel =
    summary.vsAverage.percent === 0
      ? "at average"
      : `${vsSign}${summary.vsAverage.percent}% vs. avg`;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900">
        Account Summary
      </h3>
      <p className="mt-1 text-xs text-neutral-500">
        {formatAccount(summary.account, summary.accountName)}
      </p>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-500">Total documents</dt>
          <dd className="font-medium text-neutral-900">
            {summary.totalBookings}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-500">Flagged</dt>
          <dd className="font-medium text-neutral-900">
            {`${summary.flaggedCount} (${summary.flaggedPercent.toFixed(1)}%)`}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-500">Avg. amount</dt>
          <dd className="font-medium text-neutral-900 tabular-nums">
            {formatAmount(summary.averageAmount)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-500">This booking</dt>
          <dd className="font-medium text-neutral-900 tabular-nums">
            {formatAmount(summary.currentAmount)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-500">vs. avg</dt>
          <dd
            data-testid="vs-average"
            className={`font-medium ${VS_AVERAGE_STYLES[summary.vsAverage.severity]}`}
          >
            {vsLabel}
          </dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-neutral-100 pt-3">
        <Link
          href={`/bookings?account=${summary.account}`}
          className="text-brand text-xs font-medium hover:underline"
        >
          Show all on {summary.account} &rarr;
        </Link>
      </div>
    </div>
  );
}
