import { describe, expect, it } from "vitest";
import {
  parseBookingFilters,
  serializeBookingFilters,
  bookingListUrl,
} from "./filter-params";
import type { BookingFilters } from "./booking.types";

describe("filter-params", () => {
  describe("parseBookingFilters", () => {
    it("returns defaults for empty params", () => {
      const result = parseBookingFilters({});
      expect(result).toEqual({
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
      });
    });

    it("parses search", () => {
      const result = parseBookingFilters({ search: "Mueller" });
      expect(result.search).toBe("Mueller");
    });

    it("parses valid status", () => {
      const result = parseBookingFilters({ status: "critical" });
      expect(result.status).toBe("critical");
    });

    it("ignores invalid status", () => {
      const result = parseBookingFilters({ status: "invalid" });
      expect(result.status).toBeNull();
    });

    it("parses comma-separated flag types", () => {
      const result = parseBookingFilters({
        flags: "duplicate_booking,unusual_amount",
      });
      expect(result.flagTypes).toEqual(["duplicate_booking", "unusual_amount"]);
    });

    it("filters out invalid flag types", () => {
      const result = parseBookingFilters({
        flags: "duplicate_booking,bad_flag",
      });
      expect(result.flagTypes).toEqual(["duplicate_booking"]);
    });

    it("parses numeric amount filters", () => {
      const result = parseBookingFilters({
        amountMin: "500",
        amountMax: "5000",
      });
      expect(result.amountMin).toBe(500);
      expect(result.amountMax).toBe(5000);
    });

    it("returns null for non-numeric amount", () => {
      const result = parseBookingFilters({ amountMin: "abc" });
      expect(result.amountMin).toBeNull();
    });

    it("parses date range", () => {
      const result = parseBookingFilters({
        dateFrom: "2025-01-01",
        dateTo: "2025-02-28",
      });
      expect(result.dateFrom).toBe("2025-01-01");
      expect(result.dateTo).toBe("2025-02-28");
    });

    it("parses page number", () => {
      const result = parseBookingFilters({ page: "3" });
      expect(result.page).toBe(3);
    });

    it("defaults page to 1 for invalid value", () => {
      const result = parseBookingFilters({ page: "abc" });
      expect(result.page).toBe(1);
    });

    it("parses sort and direction", () => {
      const result = parseBookingFilters({ sort: "amount", dir: "asc" });
      expect(result.sort).toBe("amount");
      expect(result.sortDirection).toBe("asc");
    });

    it("defaults invalid sort column", () => {
      const result = parseBookingFilters({ sort: "invalid" });
      expect(result.sort).toBe("date");
    });

    it("defaults invalid sort direction", () => {
      const result = parseBookingFilters({ dir: "sideways" });
      expect(result.sortDirection).toBe("desc");
    });

    it("trims whitespace from string values", () => {
      const result = parseBookingFilters({ search: "  Mueller  " });
      expect(result.search).toBe("Mueller");
    });

    it("treats empty strings as null", () => {
      const result = parseBookingFilters({ search: "", account: "  " });
      expect(result.search).toBeNull();
      expect(result.account).toBeNull();
    });
  });

  describe("serializeBookingFilters", () => {
    it("omits default values", () => {
      const params = serializeBookingFilters({
        page: 1,
        sort: "date",
        sortDirection: "desc",
      });
      expect(params.toString()).toBe("");
    });

    it("serializes search", () => {
      const params = serializeBookingFilters({ search: "Mueller" });
      expect(params.get("search")).toBe("Mueller");
    });

    it("serializes status", () => {
      const params = serializeBookingFilters({ status: "critical" });
      expect(params.get("status")).toBe("critical");
    });

    it("serializes flag types as comma-separated", () => {
      const params = serializeBookingFilters({
        flagTypes: ["duplicate_booking", "unusual_amount"],
      });
      expect(params.get("flags")).toBe("duplicate_booking,unusual_amount");
    });

    it("serializes amount range", () => {
      const params = serializeBookingFilters({
        amountMin: 500,
        amountMax: 5000,
      });
      expect(params.get("amountMin")).toBe("500");
      expect(params.get("amountMax")).toBe("5000");
    });

    it("serializes non-default page", () => {
      const params = serializeBookingFilters({ page: 3 });
      expect(params.get("page")).toBe("3");
    });

    it("serializes non-default sort", () => {
      const params = serializeBookingFilters({ sort: "amount" });
      expect(params.get("sort")).toBe("amount");
    });

    it("serializes non-default direction", () => {
      const params = serializeBookingFilters({ sortDirection: "asc" });
      expect(params.get("dir")).toBe("asc");
    });

    it("omits null and empty values", () => {
      const params = serializeBookingFilters({
        search: null,
        status: null,
        flagTypes: [],
        account: null,
        amountMin: null,
        amountMax: null,
      });
      expect(params.toString()).toBe("");
    });
  });

  describe("parse/serialize roundtrip", () => {
    it("roundtrips a full filter set", () => {
      const original: BookingFilters = {
        search: "Mueller",
        status: "critical",
        flagTypes: ["duplicate_booking", "unusual_amount"],
        account: "060000",
        amountMin: 500,
        amountMax: 5000,
        dateFrom: "2025-01-01",
        dateTo: "2025-02-28",
        page: 2,
        pageSize: 50,
        sort: "amount",
        sortDirection: "asc",
      };

      const serialized = serializeBookingFilters(original);
      const raw: Record<string, string | undefined> = {};
      for (const [key, value] of serialized.entries()) {
        raw[key] = value;
      }
      const parsed = parseBookingFilters(raw);

      expect(parsed).toEqual(original);
    });

    it("roundtrips default filters to empty params", () => {
      const defaults: BookingFilters = {
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
      };

      const serialized = serializeBookingFilters(defaults);
      expect(serialized.toString()).toBe("");

      const parsed = parseBookingFilters({});
      expect(parsed).toEqual(defaults);
    });
  });

  describe("bookingListUrl", () => {
    it("returns bare path for default filters", () => {
      expect(bookingListUrl({})).toBe("/bookings");
    });

    it("appends search params for non-default filters", () => {
      const url = bookingListUrl({ search: "Mueller", status: "critical" });
      expect(url).toContain("/bookings?");
      expect(url).toContain("search=Mueller");
      expect(url).toContain("status=critical");
    });

    it("returns /bookings for default filter values", () => {
      const url = bookingListUrl({
        page: 1,
        sort: "date",
        sortDirection: "desc",
      });
      expect(url).toBe("/bookings");
    });
  });
});
