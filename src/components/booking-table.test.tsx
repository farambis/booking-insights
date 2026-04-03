import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookingTable } from "./booking-table";
import type { BookingListItem, SortableColumn } from "@/lib/bookings";

function makeBooking(
  overrides: Partial<BookingListItem> = {},
): BookingListItem {
  return {
    documentId: "5000000001",
    postingDate: "2025-02-15",
    description: "Lieferant Mueller GmbH",
    glAccount: "060000",
    glAccountName: "Gehaelter",
    contraAccount: "090000",
    contraAccountName: "Bank Hauptkonto",
    amount: 1404.17,
    currency: "EUR",
    status: "clean",
    flags: [],
    documentType: "KR",

    ...overrides,
  };
}

const defaultSort = {
  column: "date" as SortableColumn,
  direction: "desc" as const,
};

const defaultSortUrls: Record<SortableColumn, string> = {
  date: "/bookings?sort=date&dir=asc",
  documentId: "/bookings?sort=documentId&dir=asc",
  description: "/bookings?sort=description&dir=asc",
  account: "/bookings?sort=account&dir=asc",
  amount: "/bookings?sort=amount&dir=asc",
  status: "/bookings?sort=status&dir=asc",
};

describe("BookingTable", () => {
  it("renders table headers", () => {
    render(
      <BookingTable
        bookings={[]}
        currentSort={defaultSort}
        sortUrls={defaultSortUrls}
        baseDetailUrl="/bookings"
      />,
    );
    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(7);
    expect(headers[1]).toHaveTextContent("Date");
    expect(headers[2]).toHaveTextContent("Doc Nr");
    expect(headers[3]).toHaveTextContent("Description");
    expect(headers[4]).toHaveTextContent("Account");
    expect(headers[5]).toHaveTextContent("Amount");
    expect(headers[6]).toHaveTextContent("Status");
  });

  it("renders booking rows with data", () => {
    const booking = makeBooking();
    render(
      <BookingTable
        bookings={[booking]}
        currentSort={defaultSort}
        sortUrls={defaultSortUrls}
        baseDetailUrl="/bookings"
      />,
    );
    expect(screen.getByText("15.02.2025")).toBeInTheDocument();
    expect(screen.getByText("5000000001")).toBeInTheDocument();
    expect(screen.getByText("Lieferant Mueller GmbH")).toBeInTheDocument();
    expect(screen.getByText("060000")).toBeInTheDocument();
  });

  it("renders links to detail pages", () => {
    const booking = makeBooking();
    render(
      <BookingTable
        bookings={[booking]}
        currentSort={defaultSort}
        sortUrls={defaultSortUrls}
        baseDetailUrl="/bookings"
      />,
    );
    const links = screen.getAllByRole("link", { name: "5000000001" });
    expect(links[0]).toHaveAttribute("href", "/bookings/5000000001");
  });

  it("renders sort links in column headers", () => {
    render(
      <BookingTable
        bookings={[makeBooking()]}
        currentSort={defaultSort}
        sortUrls={defaultSortUrls}
        baseDetailUrl="/bookings"
      />,
    );
    const amountLink = screen.getByRole("link", { name: "Amount" });
    expect(amountLink).toHaveAttribute("href", "/bookings?sort=amount&dir=asc");
  });

  it("applies critical row tinting", () => {
    const booking = makeBooking({
      status: "critical",
      flags: [
        {
          type: "duplicate_booking",
          severity: "critical",
          explanation: "test",
          confidence: 0.8,
          detectedAt: "2025-01-01",
          relatedDocumentId: null,
        },
      ],
    });
    render(
      <BookingTable
        bookings={[booking]}
        currentSort={defaultSort}
        sortUrls={defaultSortUrls}
        baseDetailUrl="/bookings"
      />,
    );
    const row = screen.getByText("Lieferant Mueller GmbH").closest("tr");
    expect(row?.className).toContain("bg-critical-bg/80");
    expect(row?.className).toContain("border-l-[3px]");
  });

  it("applies warning row tinting", () => {
    const booking = makeBooking({
      status: "warning",
      flags: [
        {
          type: "text_typo",
          severity: "warning",
          explanation: "test",
          confidence: 0.7,
          detectedAt: "2025-01-01",
          relatedDocumentId: null,
        },
      ],
    });
    render(
      <BookingTable
        bookings={[booking]}
        currentSort={defaultSort}
        sortUrls={defaultSortUrls}
        baseDetailUrl="/bookings"
      />,
    );
    const row = screen.getByText("Lieferant Mueller GmbH").closest("tr");
    expect(row?.className).toContain("bg-warning-bg/60");
    expect(row?.className).toContain("border-l-[3px]");
  });

  it("renders status indicator dot for critical bookings", () => {
    const booking = makeBooking({
      status: "critical",
      flags: [
        {
          type: "duplicate_booking",
          severity: "critical",
          explanation: "test",
          confidence: 0.8,
          detectedAt: "2025-01-01",
          relatedDocumentId: null,
        },
      ],
    });
    const { container } = render(
      <BookingTable
        bookings={[booking]}
        currentSort={defaultSort}
        sortUrls={defaultSortUrls}
        baseDetailUrl="/bookings"
      />,
    );
    const dot = container.querySelector(".text-critical");
    expect(dot).not.toBeNull();
  });

  it("renders status badge for critical bookings", () => {
    const booking = makeBooking({
      status: "critical",
      flags: [
        {
          type: "duplicate_booking",
          severity: "critical",
          explanation: "test",
          confidence: 0.8,
          detectedAt: "2025-01-01",
          relatedDocumentId: null,
        },
      ],
    });
    render(
      <BookingTable
        bookings={[booking]}
        currentSort={defaultSort}
        sortUrls={defaultSortUrls}
        baseDetailUrl="/bookings"
      />,
    );
    expect(screen.getByText("CRIT")).toBeInTheDocument();
  });

  it("shows negative amounts with critical text color", () => {
    const booking = makeBooking({ amount: -5000 });
    const { container } = render(
      <BookingTable
        bookings={[booking]}
        currentSort={defaultSort}
        sortUrls={defaultSortUrls}
        baseDetailUrl="/bookings"
      />,
    );
    const amountCell = container.querySelector("td.text-critical");
    expect(amountCell).not.toBeNull();
  });

  it("does not crash when booking has non-clean status but empty flags", () => {
    const booking = makeBooking({
      status: "warning",
      flags: [],
    });
    expect(() =>
      render(
        <BookingTable
          bookings={[booking]}
          currentSort={defaultSort}
          sortUrls={defaultSortUrls}
          baseDetailUrl="/bookings"
        />,
      ),
    ).not.toThrow();
  });

  it("shows sort direction indicator on active column", () => {
    render(
      <BookingTable
        bookings={[makeBooking()]}
        currentSort={{ column: "date", direction: "desc" }}
        sortUrls={defaultSortUrls}
        baseDetailUrl="/bookings"
      />,
    );
    const dateLink = screen.getByRole("link", { name: /Date/ });
    expect(dateLink.textContent).toContain("\u2193");
  });
});
