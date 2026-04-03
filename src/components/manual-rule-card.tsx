import type { BookingRule, RuleCategory } from "@/lib/bookings/rule.types";

const CATEGORY_LABELS: Record<RuleCategory, string> = {
  account_tax_code: "Account / Tax Code",
  account_cost_center: "Account / Cost Center",
  document_type_account: "Document Type / Account",
  recurring_text: "Recurring Text",
  amount_range: "Amount Range",
};

function confidenceColor(confidence: number): string {
  if (confidence >= 0.9) return "bg-green-500";
  if (confidence >= 0.7) return "bg-blue-500";
  return "bg-amber-500";
}

function violationLink(rule: BookingRule): string | null {
  if (rule.violationCount === 0) return null;
  const params = new URLSearchParams();
  // Filter by account when available
  if (rule.scope.glAccount) {
    params.set("account", rule.scope.glAccount);
  }
  // Use search for text-based rules (partial match on booking text)
  if (rule.scope.textPattern) {
    params.set("search", rule.scope.textPattern);
  }
  // Note: costCenter and documentType filters are not yet supported
  // in the bookings filter system. These links filter by what's available.
  return `/bookings?${params.toString()}`;
}

interface ManualRuleCardProps {
  rule: BookingRule;
}

export function ManualRuleCard({ rule }: ManualRuleCardProps) {
  const confidencePercent = Math.round(rule.confidence * 100);
  const supportPercent = Math.round(rule.supportRatio * 100);
  const link = violationLink(rule);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <span className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
        {CATEGORY_LABELS[rule.category]}
      </span>

      <h3 className="mt-2 text-lg font-semibold text-neutral-900">
        {rule.title}
      </h3>

      <p className="mt-1 text-sm text-neutral-600">{rule.description}</p>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Match rate</span>
          <span>
            {rule.supportCount} of {rule.totalEvaluated} bookings (
            {supportPercent}%)
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className={`h-full rounded-full ${confidenceColor(rule.supportRatio)}`}
            style={{ width: `${supportPercent}%` }}
          />
        </div>
      </div>

      {rule.evidence.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-neutral-500">Examples:</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {rule.evidence.map((e, i) => (
              <a
                key={`${e.documentId}-${i}`}
                href={`/bookings/${e.documentId}`}
                className="font-mono text-xs text-blue-600 underline-offset-2 hover:underline"
              >
                {e.documentId}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 border-t border-neutral-100 pt-3">
        {rule.violationCount === 0 ? (
          <p className="text-xs text-neutral-500">No violations found</p>
        ) : (
          <a
            href={link!}
            className="text-xs text-amber-600 underline-offset-2 hover:underline"
          >
            {rule.violationCount} violation
            {rule.violationCount !== 1 ? "s" : ""} &middot; View violations
            &rarr;
          </a>
        )}
      </div>
    </div>
  );
}
