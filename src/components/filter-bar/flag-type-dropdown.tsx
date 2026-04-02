"use client";

import { useState, useRef, useEffect } from "react";
import type { FlagType } from "@/lib/bookings";

interface FlagTypeDropdownProps {
  value: FlagType[];
  flagTypes: { id: FlagType; label: string }[];
  onChange: (value: FlagType[]) => void;
}

export function FlagTypeDropdown({
  value,
  flagTypes,
  onChange,
}: FlagTypeDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleFlag(flag: FlagType) {
    if (value.includes(flag)) {
      onChange(value.filter((f) => f !== flag));
    } else {
      onChange([...value, flag]);
    }
  }

  const buttonLabel =
    value.length === 0 ? "Flag: All" : `Flag: ${value.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
      >
        {buttonLabel}
        <span className="ml-1">&#9662;</span>
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-1 w-64 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg">
          {flagTypes.map((ft) => (
            <label
              key={ft.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-neutral-50"
            >
              <input
                type="checkbox"
                checked={value.includes(ft.id)}
                onChange={() => toggleFlag(ft.id)}
                className="rounded border-neutral-300"
              />
              {ft.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
