"use client";

interface AmountRangeProps {
  min: number | null;
  max: number | null;
  onChange: (min: number | null, max: number | null) => void;
}

export function AmountRange({ min, max, onChange }: AmountRangeProps) {
  function handleMinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    const num = val === "" ? null : Number(val);
    onChange(num !== null && Number.isFinite(num) ? num : null, max);
  }

  function handleMaxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    const num = val === "" ? null : Number(val);
    onChange(min, num !== null && Number.isFinite(num) ? num : null);
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        placeholder="Min"
        value={min ?? ""}
        onChange={handleMinChange}
        className="focus:border-brand focus:ring-brand w-24 rounded border border-neutral-200 bg-white px-2 py-2 text-right text-sm tabular-nums focus:ring-1 focus:outline-none"
      />
      <span className="text-sm text-neutral-400">&mdash;</span>
      <input
        type="number"
        placeholder="Max"
        value={max ?? ""}
        onChange={handleMaxChange}
        className="focus:border-brand focus:ring-brand w-24 rounded border border-neutral-200 bg-white px-2 py-2 text-right text-sm tabular-nums focus:ring-1 focus:outline-none"
      />
      <span className="text-xs text-neutral-400">EUR</span>
    </div>
  );
}
