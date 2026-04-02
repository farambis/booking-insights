"use client";

import { useState, useRef, useEffect } from "react";

interface AccountDropdownProps {
  value: string | null;
  accounts: { number: string; name: string }[];
  onChange: (value: string | null) => void;
}

export function AccountDropdown({
  value,
  accounts,
  onChange,
}: AccountDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  const filtered = search
    ? accounts.filter(
        (a) =>
          a.number.includes(search) ||
          a.name.toLowerCase().includes(search.toLowerCase()),
      )
    : accounts;

  const selectedAccount = value
    ? accounts.find((a) => a.number === value)
    : null;

  const buttonLabel = selectedAccount
    ? `${selectedAccount.number} \u2014 ${selectedAccount.name}`
    : "Account: All";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="max-w-[240px] truncate rounded border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
      >
        {buttonLabel}
        <span className="ml-1">&#9662;</span>
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-1 w-72 rounded-lg border border-neutral-200 bg-white shadow-lg">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="focus:border-brand focus:ring-brand w-full rounded border border-neutral-200 px-2 py-1.5 text-sm focus:ring-1 focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
                setSearch("");
              }}
              className={`w-full rounded px-2 py-1.5 text-left text-sm hover:bg-neutral-50 ${
                value === null ? "bg-brand-tint text-brand font-medium" : ""
              }`}
            >
              All accounts
            </button>
            {filtered.map((account) => (
              <button
                key={account.number}
                type="button"
                onClick={() => {
                  onChange(account.number);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full rounded px-2 py-1.5 text-left text-sm hover:bg-neutral-50 ${
                  value === account.number
                    ? "bg-brand-tint text-brand font-medium"
                    : ""
                }`}
              >
                {account.number} &mdash; {account.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
