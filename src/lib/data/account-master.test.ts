import { describe, expect, it } from "vitest";
import {
  GL_ACCOUNTS,
  COST_CENTERS,
  DOCUMENT_TYPES,
  ACCOUNT_RANGES,
  type GlAccount,
} from "./account-master";

describe("Account Master", () => {
  describe("ACCOUNT_RANGES", () => {
    it("defines non-overlapping ranges covering 010000-099999", () => {
      const sorted = [...ACCOUNT_RANGES].sort((a, b) =>
        a.from.localeCompare(b.from),
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        const currentEnd = parseInt(sorted[i].to, 10);
        const nextStart = parseInt(sorted[i + 1].from, 10);
        expect(currentEnd).toBeLessThan(nextStart);
      }
    });

    it("each range has a category name", () => {
      for (const range of ACCOUNT_RANGES) {
        expect(range.category).toBeTruthy();
        expect(range.from.length).toBe(6);
        expect(range.to.length).toBe(6);
      }
    });
  });

  describe("GL_ACCOUNTS", () => {
    it("defines at least 25 accounts", () => {
      expect(GL_ACCOUNTS.length).toBeGreaterThanOrEqual(25);
    });

    it("each account has a 6-digit zero-padded number", () => {
      for (const account of GL_ACCOUNTS) {
        expect(account.number).toMatch(/^\d{6}$/);
      }
    });

    it("each account has a name and category", () => {
      for (const account of GL_ACCOUNTS) {
        expect(account.name).toBeTruthy();
        expect(account.category).toBeTruthy();
      }
    });

    it("account numbers fall within defined ranges", () => {
      for (const account of GL_ACCOUNTS) {
        const num = parseInt(account.number, 10);
        const inRange = ACCOUNT_RANGES.some(
          (r) => num >= parseInt(r.from, 10) && num <= parseInt(r.to, 10),
        );
        expect(inRange).toBe(true);
      }
    });

    it("has no duplicate account numbers", () => {
      const numbers = GL_ACCOUNTS.map((a: GlAccount) => a.number);
      expect(new Set(numbers).size).toBe(numbers.length);
    });
  });

  describe("COST_CENTERS", () => {
    it("defines at least 5 cost centers", () => {
      expect(COST_CENTERS.length).toBeGreaterThanOrEqual(5);
    });

    it("each cost center has an id and name", () => {
      for (const cc of COST_CENTERS) {
        expect(cc.id).toBeTruthy();
        expect(cc.name).toBeTruthy();
      }
    });
  });

  describe("DOCUMENT_TYPES", () => {
    it("defines the required SAP document types", () => {
      const codes = DOCUMENT_TYPES.map((d) => d.code);
      expect(codes).toContain("KR");
      expect(codes).toContain("DR");
      expect(codes).toContain("KZ");
      expect(codes).toContain("DZ");
      expect(codes).toContain("SA");
      expect(codes).toContain("AB");
    });

    it("each document type has a code and name", () => {
      for (const dt of DOCUMENT_TYPES) {
        expect(dt.code).toBeTruthy();
        expect(dt.name).toBeTruthy();
      }
    });
  });
});
