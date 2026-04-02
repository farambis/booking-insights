"use client";

interface DateRangePickerProps {
  dateFrom: string | null;
  dateTo: string | null;
  onChange: (dateFrom: string | null, dateTo: string | null) => void;
}

function getPresetRange(preset: "thisMonth" | "lastMonth"): {
  from: string;
  to: string;
} {
  const now = new Date();
  if (preset === "thisMonth") {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    return {
      from: `${year}-${month}-01`,
      to: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
    };
  }
  // lastMonth
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = prev.getFullYear();
  const month = String(prev.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(year, prev.getMonth() + 1, 0).getDate();
  return {
    from: `${year}-${month}-01`,
    to: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  onChange,
}: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={dateFrom ?? ""}
        onChange={(e) => onChange(e.target.value || null, dateTo)}
        className="focus:border-brand focus:ring-brand rounded border border-neutral-200 bg-white px-2 py-2 text-sm focus:ring-1 focus:outline-none"
      />
      <span className="text-sm text-neutral-400">to</span>
      <input
        type="date"
        value={dateTo ?? ""}
        onChange={(e) => onChange(dateFrom, e.target.value || null)}
        className="focus:border-brand focus:ring-brand rounded border border-neutral-200 bg-white px-2 py-2 text-sm focus:ring-1 focus:outline-none"
      />
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => {
            const range = getPresetRange("thisMonth");
            onChange(range.from, range.to);
          }}
          className="rounded border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
        >
          This month
        </button>
        <button
          type="button"
          onClick={() => {
            const range = getPresetRange("lastMonth");
            onChange(range.from, range.to);
          }}
          className="rounded border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
        >
          Last month
        </button>
        <button
          type="button"
          onClick={() => onChange(null, null)}
          className="rounded border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
        >
          All
        </button>
      </div>
    </div>
  );
}
