export function Topbar() {
  return (
    <header className="bg-surface flex h-12 shrink-0 items-center border-b border-neutral-200 px-4">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-neutral-900">N</span>
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
