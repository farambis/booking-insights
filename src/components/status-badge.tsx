import type { BookingStatus } from "@/lib/bookings/booking.types";

type StatusBadgeStatus = BookingStatus | "info";

interface StatusBadgeProps {
  status: StatusBadgeStatus;
  size?: "default" | "large";
}

const VARIANT_STYLES: Record<StatusBadgeStatus, string> = {
  critical: "bg-critical-bg text-critical border-critical-border",
  warning: "bg-warning-bg text-warning border-warning-border",
  clean: "bg-clean-bg text-clean border-clean-border",
  info: "bg-info-bg text-info border-info-border",
};

const VARIANT_LABELS: Record<StatusBadgeStatus, string> = {
  critical: "CRIT",
  warning: "WARN",
  clean: "OK",
  info: "INFO",
};

const SIZE_STYLES: Record<"default" | "large", string> = {
  default: "text-xs px-2 py-0.5",
  large: "text-sm px-3 py-1",
};

export function StatusBadge({ status, size = "default" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block rounded border font-semibold uppercase ${VARIANT_STYLES[status]} ${SIZE_STYLES[size]}`}
    >
      {VARIANT_LABELS[status]}
    </span>
  );
}
