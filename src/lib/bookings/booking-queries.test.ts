import { describe, expect, it } from "vitest";
import type {
  BookingDetail,
  BookingFilters,
  BookingListItem,
} from "./booking.types";
import { queryBookings, buildDashboardSummary } from "./booking-queries";

function makeBooking(
  overrides: Partial<BookingListItem> = {},
): BookingListItem {
  return {
    documentId: "5000000001",
    postingDate: "2025-01-15",
    description: "Test booking",
    glAccount: "070000",
    glAccountName: "Miete",
    contraAccount: "090000",
    contraAccountName: "Bank Hauptkonto",
    amount: 1000,
    currency: "EUR",
    status: "clean",
    flags: [],
    documentType: "SA",
    ...overrides,
  };
}

function makeDetailBooking(
  overrides: Partial<BookingDetail> = {},
): BookingDetail {
  return {
    ...makeBooking(overrides),
    lineId: 1,
    companyCode: "1000",
    costCenter: null,
    costCenterName: null,
    bookingText: "Test booking",
    vendorId: null,
    customerId: null,
    taxCode: null,
    debitCredit: "S",
    documentLines: [
      {
        lineId: 1,
        glAccount: "070000",
        glAccountName: "Miete",
        amount: 1000,
        debitCredit: "S",
        costCenter: null,
      },
      {
        lineId: 2,
        glAccount: "090000",
        glAccountName: "Bank Hauptkonto",
        amount: 1000,
        debitCredit: "H",
        costCenter: null,
      },
    ],
    ...overrides,
  };
}

function defaultFilters(
  overrides: Partial<BookingFilters> = {},
): BookingFilters {
  return {
    search: null,
    status: null,
    flagTypes: [],
    account: null,
    amountMin: null,
    amountMax: null,
    dateFrom: null,
    dateTo: null,
    page: 1,
    pageSize: 50,
    sort: "date",
    sortDirection: "desc",
    ...overrides,
  };
}

describe("booking-queries", () => {
  describe("queryBookings - filtering", () => {
    const bookings: BookingListItem[] = [
      makeBooking({
        documentId: "5000000001",
        description: "Miete Januar",
        glAccount: "070000",
        amount: 1000,
        status: "clean",
        postingDate: "2025-01-15",
      }),
      makeBooking({
        documentId: "5000000002",
        description: "Gehalt Mueller",
        glAccount: "060000",
        glAccountName: "Gehaelter",
        amount: 5000,
        status: "critical",
        flags: [
          {
            type: "duplicate_entry",
            severity: "critical",
            explanation: "dup",
            confidence: 0.9,
            detectedAt: "2025-01-15",
            relatedDocumentId: null,
          },
        ],
        postingDate: "2025-01-20",
      }),
      makeBooking({
        documentId: "5000000003",
        description: "Lieferant Schmidt",
        glAccount: "050000",
        amount: 3000,
        status: "warning",
        flags: [
          {
            type: "unusual_amount",
            severity: "warning",
            explanation: "unusual",
            confidence: 0.6,
            detectedAt: "2025-01-20",
            relatedDocumentId: null,
          },
        ],
        postingDate: "2025-02-10",
      }),
    ];

    it("returns all bookings with no filters", () => {
      const result = queryBookings(bookings, defaultFilters());
      expect(result.totalCount).toBe(3);
      expect(result.items).toHaveLength(3);
    });

    it("filters by search text (description)", () => {
      const result = queryBookings(
        bookings,
        defaultFilters({ search: "Mueller" }),
      );
      expect(result.totalCount).toBe(1);
      expect(result.items[0].documentId).toBe("5000000002");
    });

    it("filters by search text (document id)", () => {
      const result = queryBookings(
        bookings,
        defaultFilters({ search: "5000000003" }),
      );
      expect(result.totalCount).toBe(1);
      expect(result.items[0].documentId).toBe("5000000003");
    });

    it("filters by search text (account name)", () => {
      const result = queryBookings(
        bookings,
        defaultFilters({ search: "Gehaelter" }),
      );
      expect(result.totalCount).toBe(1);
      expect(result.items[0].documentId).toBe("5000000002");
    });

    it("search is case-insensitive", () => {
      const result = queryBookings(
        bookings,
        defaultFilters({ search: "mueller" }),
      );
      expect(result.totalCount).toBe(1);
    });

    it("filters by status", () => {
      const result = queryBookings(
        bookings,
        defaultFilters({ status: "critical" }),
      );
      expect(result.totalCount).toBe(1);
      expect(result.items[0].status).toBe("critical");
    });

    it("filters by flag type", () => {
      const result = queryBookings(
        bookings,
        defaultFilters({ flagTypes: ["unusual_amount"] }),
      );
      expect(result.totalCount).toBe(1);
      expect(result.items[0].documentId).toBe("5000000003");
    });

    it("filters by account", () => {
      const result = queryBookings(
        bookings,
        defaultFilters({ account: "060000" }),
      );
      expect(result.totalCount).toBe(1);
      expect(result.items[0].glAccount).toBe("060000");
    });

    it("filters by account matching contra account", () => {
      const result = queryBookings(
        bookings,
        defaultFilters({ account: "090000" }),
      );
      // All bookings have contraAccount "090000"
      expect(result.totalCount).toBe(3);
    });

    it("filters by amount range (min)", () => {
      const result = queryBookings(
        bookings,
        defaultFilters({ amountMin: 2000 }),
      );
      expect(result.totalCount).toBe(2);
    });

    it("filters by amount range (max)", () => {
      const result = queryBookings(
        bookings,
        defaultFilters({ amountMax: 2000 }),
      );
      expect(result.totalCount).toBe(1);
      expect(result.items[0].amount).toBe(1000);
    });

    it("filters by date range", () => {
      const result = queryBookings(
        bookings,
        defaultFilters({ dateFrom: "2025-01-20", dateTo: "2025-02-15" }),
      );
      expect(result.totalCount).toBe(2);
    });

    it("combines multiple filters", () => {
      const result = queryBookings(
        bookings,
        defaultFilters({ status: "warning", amountMin: 2000 }),
      );
      expect(result.totalCount).toBe(1);
      expect(result.items[0].documentId).toBe("5000000003");
    });
  });

  describe("queryBookings - sorting", () => {
    const bookings: BookingListItem[] = [
      makeBooking({
        documentId: "5000000001",
        postingDate: "2025-01-15",
        amount: 3000,
        description: "Charlie",
        glAccount: "070000",
        status: "warning",
      }),
      makeBooking({
        documentId: "5000000002",
        postingDate: "2025-01-20",
        amount: 1000,
        description: "Alice",
        glAccount: "060000",
        status: "critical",
      }),
      makeBooking({
        documentId: "5000000003",
        postingDate: "2025-01-10",
        amount: 2000,
        description: "Bob",
        glAccount: "050000",
        status: "clean",
      }),
    ];

    it("sorts by date descending (default)", () => {
      const result = queryBookings(bookings, defaultFilters());
      expect(result.items.map((b) => b.documentId)).toEqual([
        "5000000002",
        "5000000001",
        "5000000003",
      ]);
    });

    it("sorts by date ascending", () => {
      const result = queryBookings(
        bookings,
        defaultFilters({ sort: "date", sortDirection: "asc" }),
      );
      expect(result.items.map((b) => b.documentId)).toEqual([
        "5000000003",
        "5000000001",
        "5000000002",
      ]);
    });

    it("sorts by amount ascending", () => {
      const result = queryBookings(
        bookings,
        defaultFilters({ sort: "amount", sortDirection: "asc" }),
      );
      expect(result.items.map((b) => Math.abs(b.amount))).toEqual([
        1000, 2000, 3000,
      ]);
    });

    it("sorts by description ascending", () => {
      const result = queryBookings(
        bookings,
        defaultFilters({ sort: "description", sortDirection: "asc" }),
      );
      expect(result.items.map((b) => b.description)).toEqual([
        "Alice",
        "Bob",
        "Charlie",
      ]);
    });

    it("sorts by status (critical first when asc)", () => {
      const result = queryBookings(
        bookings,
        defaultFilters({ sort: "status", sortDirection: "asc" }),
      );
      expect(result.items.map((b) => b.status)).toEqual([
        "critical",
        "warning",
        "clean",
      ]);
    });

    it("sorts by account ascending", () => {
      const result = queryBookings(
        bookings,
        defaultFilters({ sort: "account", sortDirection: "asc" }),
      );
      expect(result.items.map((b) => b.glAccount)).toEqual([
        "050000",
        "060000",
        "070000",
      ]);
    });
  });

  describe("queryBookings - pagination", () => {
    // Create 60 bookings to test pagination (page size is 50)
    const bookings: BookingListItem[] = Array.from({ length: 60 }, (_, i) =>
      makeBooking({
        documentId: `500000${String(i).padStart(4, "0")}`,
        postingDate: "2025-01-15",
      }),
    );

    it("returns first page of 50 items", () => {
      const result = queryBookings(bookings, defaultFilters({ page: 1 }));
      expect(result.items).toHaveLength(50);
      expect(result.totalCount).toBe(60);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(2);
      expect(result.pageSize).toBe(50);
    });

    it("returns second page with remaining items", () => {
      const result = queryBookings(bookings, defaultFilters({ page: 2 }));
      expect(result.items).toHaveLength(10);
      expect(result.page).toBe(2);
    });

    it("clamps page to valid range", () => {
      const result = queryBookings(bookings, defaultFilters({ page: 999 }));
      expect(result.page).toBe(2); // max page
    });

    it("returns page 1 for page 0 or negative", () => {
      const result = queryBookings(bookings, defaultFilters({ page: 0 }));
      expect(result.page).toBe(1);
    });
  });

  describe("buildDashboardSummary", () => {
    const bookings: BookingDetail[] = [
      makeDetailBooking({
        documentId: "5000000001",
        status: "critical",
        glAccount: "060000",
        flags: [
          {
            type: "duplicate_entry",
            severity: "critical",
            explanation: "",
            confidence: 0.9,
            detectedAt: "2025-01-15",
            relatedDocumentId: null,
          },
        ],
        postingDate: "2025-01-15",
      }),
      makeDetailBooking({
        documentId: "5000000002",
        status: "warning",
        glAccount: "070000",
        flags: [
          {
            type: "unusual_amount",
            severity: "warning",
            explanation: "",
            confidence: 0.6,
            detectedAt: "2025-01-15",
            relatedDocumentId: null,
          },
        ],
        postingDate: "2025-01-15",
      }),
      makeDetailBooking({
        documentId: "5000000003",
        status: "clean",
        glAccount: "060000",
        postingDate: "2025-01-20",
      }),
    ];

    it("computes correct document counts", () => {
      const summary = buildDashboardSummary(bookings);
      expect(summary.totalDocuments).toBe(3);
      expect(summary.criticalCount).toBe(1);
      expect(summary.warningCount).toBe(1);
      expect(summary.cleanCount).toBe(1);
    });

    it("computes clean percentage", () => {
      const summary = buildDashboardSummary(bookings);
      expect(summary.cleanPercent).toBeCloseTo(33.3, 0);
    });

    it("builds flag distribution", () => {
      const summary = buildDashboardSummary(bookings);
      expect(summary.flagDistribution).toHaveLength(2);
      expect(
        summary.flagDistribution.find((f) => f.type === "duplicate_entry")
          ?.count,
      ).toBe(1);
    });

    it("builds top flagged accounts", () => {
      const summary = buildDashboardSummary(bookings);
      expect(summary.topFlaggedAccounts.length).toBeGreaterThanOrEqual(1);
      expect(summary.topFlaggedAccounts[0].account).toBe("060000");
    });

    it("builds activity by date", () => {
      const summary = buildDashboardSummary(bookings);
      expect(summary.activityByDate).toHaveLength(2);
      const jan15 = summary.activityByDate.find((a) => a.date === "2025-01-15");
      expect(jan15?.totalCount).toBe(2);
      expect(jan15?.flaggedCount).toBe(2);
    });

    it("returns recent critical bookings", () => {
      const summary = buildDashboardSummary(bookings);
      expect(summary.recentCritical).toHaveLength(1);
      expect(summary.recentCritical[0].documentId).toBe("5000000001");
    });
  });
});
