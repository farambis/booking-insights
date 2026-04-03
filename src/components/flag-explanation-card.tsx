import Link from "next/link";
import type { FlagSeverity, FlagType } from "@/lib/bookings/booking.types";

interface FlagExplanationCardProps {
  flag: {
    type: FlagType;
    label: string;
    explanation: string;
    confidencePercent: number;
    relatedDocumentId: string | null;
  };
  severity: FlagSeverity;
}

const SEVERITY_STYLES: Record<FlagSeverity, string> = {
  critical: "border-l-critical bg-critical-bg",
  warning: "border-l-warning bg-warning-bg",
};

function confidenceColor(percent: number): string {
  if (percent >= 75) return "text-critical";
  if (percent >= 50) return "text-warning";
  return "text-neutral-500";
}

export function FlagExplanationCard({
  flag,
  severity,
}: FlagExplanationCardProps) {
  return (
    <div
      className={`rounded-lg border border-l-4 p-4 ${SEVERITY_STYLES[severity]}`}
    >
      <h3 className="text-sm font-semibold tracking-wide text-neutral-900 uppercase">
        {flag.label}
      </h3>
      <p className="mt-2 text-sm text-neutral-700">{flag.explanation}</p>
      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
        <span>
          Confidence:{" "}
          <span
            className={`font-medium ${confidenceColor(flag.confidencePercent)}`}
          >
            {Math.round(flag.confidencePercent)}%
          </span>
        </span>
        {flag.relatedDocumentId && (
          <span>
            Related:{" "}
            <Link
              href={`/bookings/${flag.relatedDocumentId}`}
              className="text-brand font-medium underline-offset-2 hover:underline"
            >
              {flag.relatedDocumentId}
            </Link>
          </span>
        )}
      </div>
    </div>
  );
}
