"use client";

import type { BookingStatus } from "@/lib/bookings";

interface StatusPillGroupProps {
  value: BookingStatus | null;
  onChange: (value: BookingStatus | null) => void;
}

const PILLS: { label: string; value: BookingStatus | null }[] = [
  { label: "All", value: null },
  { label: "Critical", value: "critical" },
  { label: "Warning", value: "warning" },
  { label: "Clean", value: "clean" },
];

export function StatusPillGroup({ value, onChange }: StatusPillGroupProps) {
  return (
    <div className="flex gap-1">
      {PILLS.map((pill) => {
        const isActive = pill.value === value;
        return (
          <button
            key={pill.label}
            type="button"
            onClick={() => onChange(pill.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              isActive
                ? "bg-neutral-900 text-white"
                : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}
