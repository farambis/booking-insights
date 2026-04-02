import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentCriticalTable } from "./recent-critical-table";
import type { BookingListItem } from "@/lib/bookings/booking.types";

const bookings: BookingListItem[] = [
  {
    documentId: "5000000142",
    postingDate: "2025-02-15",
    description: "Lieferant Mueller GmbH",
    glAccount: "060000",
    glAccountName: "Gehaelter",
    contraAccount: "160000",
    contraAccountName: null,
    amount: 1404.17,
    currency: "EUR",
    status: "critical",
    flags: [
      {
        type: "duplicate_entry",
        severity: "critical",
        explanation: "Duplicate",
        confidence: 0.9,
        detectedAt: "2025-02-15",
        relatedDocumentId: "5000000141",
      },
    ],
    documentType: "KR",
  },
  {
    documentId: "5000000062",
    postingDate: "2025-02-05",
    description: "Stornobuchung",
    glAccount: "040000",
    glAccountName: "Umsatz Inland",
    contraAccount: null,
    contraAccountName: null,
    amount: -50000,
    currency: "EUR",
    status: "critical",
    flags: [
      {
        type: "unusual_amount",
        severity: "critical",
        explanation: "Unusual",
        confidence: 0.8,
        detectedAt: "2025-02-05",
        relatedDocumentId: null,
      },
    ],
    documentType: "SA",
  },
];

describe("RecentCriticalTable", () => {
  it("renders table headers", () => {
    render(<RecentCriticalTable bookings={bookings} />);
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Document")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Flag")).toBeInTheDocument();
  });

  it("renders booking rows", () => {
    render(<RecentCriticalTable bookings={bookings} />);
    expect(screen.getByText("5000000142")).toBeInTheDocument();
    expect(screen.getByText("5000000062")).toBeInTheDocument();
  });

  it("renders descriptions", () => {
    render(<RecentCriticalTable bookings={bookings} />);
    expect(screen.getByText("Lieferant Mueller GmbH")).toBeInTheDocument();
    expect(screen.getByText("Stornobuchung")).toBeInTheDocument();
  });

  it("links rows to booking detail page", () => {
    render(<RecentCriticalTable bookings={bookings} />);
    const links = screen.getAllByRole("link");
    const rowLinks = links.filter(
      (l) =>
        l.getAttribute("href")?.startsWith("/bookings/5000000142") ||
        l.getAttribute("href")?.startsWith("/bookings/5000000062"),
    );
    expect(rowLinks.length).toBeGreaterThanOrEqual(2);
  });

  it("renders View all link", () => {
    render(<RecentCriticalTable bookings={bookings} />);
    const viewAll = screen.getByRole("link", { name: /view all/i });
    expect(viewAll).toHaveAttribute("href", "/bookings?status=critical");
  });

  it("renders section heading", () => {
    render(<RecentCriticalTable bookings={bookings} />);
    expect(screen.getByText("Recent Critical Flags")).toBeInTheDocument();
  });
});
