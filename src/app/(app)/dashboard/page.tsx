import { bookingService } from "@/lib/bookings";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { KpiCardGrid } from "@/components/kpi-card-grid";
import { FlagDistributionChart } from "@/components/charts/flag-distribution-chart";
import { ActivityTimeChart } from "@/components/charts/activity-time-chart";
import { TopFlaggedAccounts } from "@/components/top-flagged-accounts";
import { RecentCriticalTable } from "@/components/recent-critical-table";

function formatDateRange(activityByDate: { date: string }[]): string {
  if (activityByDate.length === 0) return "";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const first = activityByDate[0].date;
  const last = activityByDate[activityByDate.length - 1].date;
  const [firstYear, firstMonth] = first.split("-").map(Number);
  const [lastYear, lastMonth] = last.split("-").map(Number);

  if (firstYear === lastYear && firstMonth === lastMonth) {
    return `${months[firstMonth - 1]} ${firstYear}`;
  }
  if (firstYear === lastYear) {
    return `${months[firstMonth - 1]}\u2013${months[lastMonth - 1]} ${firstYear}`;
  }
  return `${months[firstMonth - 1]} ${firstYear}\u2013${months[lastMonth - 1]} ${lastYear}`;
}

export default async function DashboardPage() {
  const summary = await bookingService.getDashboardSummary();

  const dateRange = formatDateRange(summary.activityByDate);
  const subtitle = [
    `${summary.totalDocuments} documents`,
    `${summary.totalLines} lines`,
    dateRange,
  ]
    .filter(Boolean)
    .join(" \u00b7 ");

  const criticalPercent =
    summary.totalDocuments > 0
      ? Math.round((summary.criticalCount / summary.totalDocuments) * 1000) / 10
      : 0;
  const warningPercent =
    summary.totalDocuments > 0
      ? Math.round((summary.warningCount / summary.totalDocuments) * 1000) / 10
      : 0;

  return (
    <>
      <PageHeader title="Booking Insights" subtitle={subtitle} />

      <KpiCardGrid>
        <KpiCard
          label="Total Documents"
          formattedValue={summary.totalDocuments.toLocaleString("de-DE")}
          subtitle={`${summary.totalLines.toLocaleString("de-DE")} lines`}
          variant="default"
        />
        <KpiCard
          label="Critical Flags"
          formattedValue={summary.criticalCount.toLocaleString("de-DE")}
          subtitle={`${criticalPercent}% of docs`}
          variant="critical"
        />
        <KpiCard
          label="Warnings"
          formattedValue={summary.warningCount.toLocaleString("de-DE")}
          subtitle={`${warningPercent}% of docs`}
          variant="warning"
        />
        <KpiCard
          label="Clean"
          formattedValue={summary.cleanCount.toLocaleString("de-DE")}
          subtitle={`${summary.cleanPercent}%`}
          variant="clean"
        />
      </KpiCardGrid>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <FlagDistributionChart data={summary.flagDistribution} />
        </div>
        <div className="lg:col-span-2">
          <TopFlaggedAccounts accounts={summary.topFlaggedAccounts} />
        </div>
      </div>

      <div className="mt-6">
        <ActivityTimeChart data={summary.activityByDate} />
      </div>

      <div className="mt-6">
        <RecentCriticalTable bookings={summary.recentCritical} />
      </div>
    </>
  );
}
