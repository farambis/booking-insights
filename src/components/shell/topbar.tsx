function NorthscopeMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Left bar — taller */}
      <rect x="3" y="7" width="4" height="13" rx="1" fill="#006fd6" />
      {/* Right bar — shorter */}
      <rect x="17" y="11" width="4" height="9" rx="1" fill="#006fd6" />
      {/* Diagonal stroke connecting top of left bar to top of right bar */}
      <line
        x1="7"
        y1="8.5"
        x2="17"
        y2="12.5"
        stroke="#006fd6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Topbar() {
  return (
    <header className="bg-surface flex h-12 shrink-0 items-center border-b border-neutral-200 px-4">
      <div className="flex items-center gap-2">
        <NorthscopeMark size={24} />
        <span className="text-base font-semibold text-neutral-900">
          Booking Insights
        </span>
      </div>
      <div className="ml-auto">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-sm font-medium text-neutral-700">
          U
        </div>
      </div>
    </header>
  );
}
