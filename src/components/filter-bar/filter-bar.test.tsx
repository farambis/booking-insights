import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { FilterBar } from "./filter-bar";
import type { BookingFilters, FlagType } from "@/lib/bookings";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const defaultFilters: BookingFilters = {
  search: null,
  status: null,
  flagTypes: [],
  account: null,
  amountMin: null,
  amountMax: null,
  dateFrom: null,
  dateTo: null,
  pageSize: 50,
  page: 1,
  sort: "date",
  sortDirection: "desc",
};

const accounts = [
  { number: "060000", name: "Gehaelter" },
  { number: "070000", name: "Miete" },
];

const flagTypes: { id: FlagType; label: string }[] = [
  { id: "duplicate_booking", label: "Duplicate Booking" },
  { id: "unusual_amount", label: "Unusual Amount" },
];

describe("FilterBar", () => {
  beforeEach(() => {
    mockPush.mockClear();
    vi.useFakeTimers();
  });

  it("renders search input", () => {
    render(
      <FilterBar
        accounts={accounts}
        flagTypes={flagTypes}
        currentFilters={defaultFilters}
      />,
    );
    expect(
      screen.getByPlaceholderText(
        "Search by description, document, or account...",
      ),
    ).toBeInTheDocument();
  });

  it("renders status pills", () => {
    render(
      <FilterBar
        accounts={accounts}
        flagTypes={flagTypes}
        currentFilters={defaultFilters}
      />,
    );
    // "All" appears in multiple elements (status pill, flag dropdown, account dropdown)
    // Use getAllByText for "All" and check the status pills specifically
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByText("Clean")).toBeInTheDocument();
    // Check the status pill group has an "All" button
    const allButtons = screen.getAllByRole("button", { name: /^All$/ });
    expect(allButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("pushes URL when status pill is clicked", () => {
    render(
      <FilterBar
        accounts={accounts}
        flagTypes={flagTypes}
        currentFilters={defaultFilters}
      />,
    );
    fireEvent.click(screen.getByText("Critical"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("status=critical"),
    );
  });

  it("pushes URL with search after debounce", () => {
    render(
      <FilterBar
        accounts={accounts}
        flagTypes={flagTypes}
        currentFilters={defaultFilters}
      />,
    );
    const input = screen.getByPlaceholderText(
      "Search by description, document, or account...",
    );
    fireEvent.change(input, { target: { value: "Mueller" } });

    // Before debounce - should not have pushed
    expect(mockPush).not.toHaveBeenCalled();

    // After debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("search=Mueller"),
    );
  });

  it("resets page to 1 when filter changes", () => {
    const filters = { ...defaultFilters, page: 3 };
    render(
      <FilterBar
        accounts={accounts}
        flagTypes={flagTypes}
        currentFilters={filters}
      />,
    );
    fireEvent.click(screen.getByText("Warning"));
    // Should not contain page=3 since page resets to 1 (which is the default, omitted from URL)
    const url = mockPush.mock.calls[0][0] as string;
    expect(url).not.toContain("page=3");
  });

  it("shows Reset filters button when filters are active", () => {
    const filters = { ...defaultFilters, status: "critical" as const };
    render(
      <FilterBar
        accounts={accounts}
        flagTypes={flagTypes}
        currentFilters={filters}
      />,
    );
    expect(screen.getByText("Reset filters")).toBeInTheDocument();
  });

  it("does not show Reset filters button when no filters are active", () => {
    render(
      <FilterBar
        accounts={accounts}
        flagTypes={flagTypes}
        currentFilters={defaultFilters}
      />,
    );
    expect(screen.queryByText("Reset filters")).not.toBeInTheDocument();
  });

  it("navigates to bare /bookings on reset", () => {
    const filters = { ...defaultFilters, status: "critical" as const };
    render(
      <FilterBar
        accounts={accounts}
        flagTypes={flagTypes}
        currentFilters={filters}
      />,
    );
    fireEvent.click(screen.getByText("Reset filters"));
    expect(mockPush).toHaveBeenCalledWith("/bookings");
  });
});
