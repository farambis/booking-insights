import Link from "next/link";
import type { FlagSeverity, FlagType } from "@/lib/bookings/booking.types";
import { formatAmount, formatDateCompact } from "@/lib/bookings/format";

interface RelatedDocumentInfo {
  documentId: string;
  description: string;
  postingDate: string;
  amount: number;
  currency: string;
  glAccount: string;
  glAccountName: string | null;
}

interface FlagExplanationCardProps {
  flag: {
    type: FlagType;
    label: string;
    explanation: string;
    confidencePercent: number;
    relatedDocumentId: string | null;
  };
  severity: FlagSeverity;
  relatedDocument?: RelatedDocumentInfo | null;
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
  relatedDocument,
}: FlagExplanationCardProps) {
  return (
    <div
      className={`rounded-lg border border-l-4 p-4 ${SEVERITY_STYLES[severity]}`}
    >
      <h3 className="text-sm font-semibold tracking-wide text-neutral-900 uppercase">
        {flag.label}
      </h3>
      <p className="mt-2 text-sm text-neutral-700">{flag.explanation}</p>

      {relatedDocument && (
        <Link
          href={`/bookings/${relatedDocument.documentId}`}
          className="mt-3 block rounded-md border border-neutral-200 bg-white/60 p-3 transition-colors hover:bg-white"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-medium text-neutral-900">
              {relatedDocument.documentId}
            </span>
            <span className="text-xs text-neutral-500">
              {relatedDocument.glAccount}
              {relatedDocument.glAccountName &&
                ` \u2014 ${relatedDocument.glAccountName}`}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-neutral-600">
            {relatedDocument.description}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
            <span>{formatDateCompact(relatedDocument.postingDate)}</span>
            <span>&middot;</span>
            <span className="tabular-nums">
              {formatAmount(
                Math.abs(relatedDocument.amount),
                relatedDocument.currency,
              )}
            </span>
          </div>
        </Link>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
        <span>
          Confidence:{" "}
          <span
            className={`font-medium ${confidenceColor(flag.confidencePercent)}`}
          >
            {Math.round(flag.confidencePercent)}%
          </span>
        </span>
        {flag.relatedDocumentId && !relatedDocument && (
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
