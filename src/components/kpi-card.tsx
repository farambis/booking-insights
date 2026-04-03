import Link from "next/link";

interface KpiCardProps {
  label: string;
  formattedValue: string;
  subtitle: string | null;
  variant: "default" | "critical" | "warning" | "clean";
  href?: string;
}

const VALUE_STYLES: Record<KpiCardProps["variant"], string> = {
  default: "text-neutral-900",
  critical: "text-critical",
  warning: "text-warning",
  clean: "text-clean",
};

const ICONS: Record<KpiCardProps["variant"], React.ReactNode> = {
  default: (
    <svg
      className="h-4 w-4 text-neutral-500"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M1 2h6v6H1V2zm8 0h6v6H9V2zM1 10h6v6H1v-6zm8 0h6v6H9v-6z" />
    </svg>
  ),
  critical: (
    <svg
      className="text-critical h-4 w-4"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 1l7 14H1L8 1zm0 5v4m0 2v1" />
      <path
        d="M8 1L1 15h14L8 1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect x="7.25" y="6" width="1.5" height="4" rx="0.5" />
      <circle cx="8" cy="12" r="0.75" />
    </svg>
  ),
  warning: (
    <svg
      className="text-warning h-4 w-4"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect x="7.25" y="4" width="1.5" height="5" rx="0.5" />
      <circle cx="8" cy="11" r="0.75" />
    </svg>
  ),
  clean: (
    <svg
      className="text-clean h-4 w-4"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 8l2 2 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export function KpiCard({
  label,
  formattedValue,
  subtitle,
  variant,
  href,
}: KpiCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500">{label}</span>
        {ICONS[variant]}
      </div>
      <p
        className={`mt-2 text-3xl font-bold tabular-nums ${VALUE_STYLES[variant]}`}
      >
        {formattedValue}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-neutral-500" data-testid="kpi-subtitle">
          {subtitle}
        </p>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition-colors hover:bg-neutral-50"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      {content}
    </div>
  );
}
