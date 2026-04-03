"use client";

import { useRouter } from "next/navigation";
import type { BookingFilters, FlagType } from "@/lib/bookings";
import { bookingListUrl } from "@/lib/bookings/filter-params";
import { SearchInput } from "./search-input";
import { StatusPillGroup } from "./status-pill-group";
import { FlagTypeDropdown } from "./flag-type-dropdown";
import { AccountDropdown } from "./account-dropdown";
import { AmountRange } from "./amount-range";
import { DateRangePicker } from "./date-range-picker";

interface FilterBarProps {
  accounts: { number: string; name: string }[];
  flagTypes: { id: FlagType; label: string }[];
  currentFilters: BookingFilters;
}

export function FilterBar({
  accounts,
  flagTypes,
  currentFilters,
}: FilterBarProps) {
  const router = useRouter();

  function updateFilters(updates: Partial<BookingFilters>) {
    const newFilters = { ...currentFilters, ...updates, page: 1 };
    router.push(bookingListUrl(newFilters));
  }

  function resetFilters() {
    router.push("/bookings");
  }

  const hasActiveFilters =
    currentFilters.search !== null ||
    currentFilters.status !== null ||
    currentFilters.flagTypes.length > 0 ||
    currentFilters.account !== null ||
    currentFilters.amountMin !== null ||
    currentFilters.amountMax !== null ||
    currentFilters.dateFrom !== null ||
    currentFilters.dateTo !== null;

  return (
    <div className="mb-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          defaultValue={currentFilters.search ?? ""}
          onChange={(search) => updateFilters({ search })}
        />
        <DateRangePicker
          dateFrom={currentFilters.dateFrom}
          dateTo={currentFilters.dateTo}
          onChange={(dateFrom, dateTo) => updateFilters({ dateFrom, dateTo })}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-neutral-500">Status:</span>
        <StatusPillGroup
          value={currentFilters.status}
          onChange={(status) => updateFilters({ status })}
        />
        <FlagTypeDropdown
          value={currentFilters.flagTypes}
          flagTypes={flagTypes}
          onChange={(flagTypes) => updateFilters({ flagTypes })}
        />
        <AccountDropdown
          value={currentFilters.account}
          accounts={accounts}
          onChange={(account) => updateFilters({ account })}
        />
        <AmountRange
          min={currentFilters.amountMin}
          max={currentFilters.amountMax}
          onChange={(amountMin, amountMax) =>
            updateFilters({ amountMin, amountMax })
          }
        />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="ml-auto text-sm text-neutral-500 hover:text-neutral-900"
          >
            Reset filters
          </button>
        )}
      </div>
    </div>
  );
}
