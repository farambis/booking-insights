import { bookingService } from "@/lib/bookings";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ManualRuleCard } from "@/components/manual-rule-card";

export default async function ManualPage() {
  const manual = await bookingService.getBookingManual();

  const subtitle = `${manual.rules.length} rules derived from ${manual.datasetSize.toLocaleString("de-DE")} bookings`;

  return (
    <>
      <PageHeader title="Booking Manual" subtitle={subtitle} />

      {manual.rules.length === 0 ? (
        <EmptyState
          heading="No rules found"
          subtext="Not enough data to derive booking rules. Add more journal entries and try again."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {manual.rules.map((rule) => (
            <ManualRuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      )}
    </>
  );
}
