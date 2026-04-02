"use client";

import { useState, useRef } from "react";

interface SearchInputProps {
  defaultValue: string;
  onChange: (value: string | null) => void;
}

export function SearchInput({ defaultValue, onChange }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setLocalValue(next);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(next.trim() || null);
    }, 300);
  }

  return (
    <input
      type="text"
      placeholder="Search by description, document, or account..."
      value={localValue}
      onChange={handleChange}
      className="focus:border-brand focus:ring-brand w-80 rounded border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-1 focus:outline-none"
    />
  );
}
