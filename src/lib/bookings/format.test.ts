import { describe, expect, it } from "vitest";
import {
  formatAmount,
  formatDateCompact,
  formatDateVerbose,
  flagTypeLabel,
  confidenceLabel,
  formatAccount,
} from "./format";

describe("format", () => {
  describe("formatAmount", () => {
    it("formats a standard amount with EUR", () => {
      expect(formatAmount(1234.56)).toBe("1.234,56 EUR");
    });

    it("formats zero", () => {
      expect(formatAmount(0)).toBe("0,00 EUR");
    });

    it("formats negative amounts", () => {
      expect(formatAmount(-1234.56)).toBe("-1.234,56 EUR");
    });

    it("uses provided currency", () => {
      expect(formatAmount(1000, "USD")).toBe("1.000,00 USD");
    });

    it("formats large amounts with thousand separators", () => {
      expect(formatAmount(1000000)).toBe("1.000.000,00 EUR");
    });

    it("rounds to 2 decimal places", () => {
      expect(formatAmount(1234.567)).toBe("1.234,57 EUR");
    });
  });

  describe("formatDateCompact", () => {
    it("formats ISO date to DD.MM.YYYY", () => {
      expect(formatDateCompact("2025-01-15")).toBe("15.01.2025");
    });

    it("handles end of month", () => {
      expect(formatDateCompact("2025-02-28")).toBe("28.02.2025");
    });

    it("handles start of year", () => {
      expect(formatDateCompact("2025-01-01")).toBe("01.01.2025");
    });
  });

  describe("formatDateVerbose", () => {
    it("formats to verbose German date", () => {
      const result = formatDateVerbose("2025-01-15");
      expect(result).toBe("15. Januar 2025");
    });

    it("formats February correctly", () => {
      const result = formatDateVerbose("2025-02-28");
      expect(result).toBe("28. Februar 2025");
    });
  });

  describe("flagTypeLabel", () => {
    it("returns label for duplicate_booking", () => {
      expect(flagTypeLabel("duplicate_booking")).toBe("Duplicate Booking");
    });

    it("returns label for missing_counterpart", () => {
      expect(flagTypeLabel("missing_counterpart")).toBe("Missing Counterpart");
    });

    it("returns label for unusual_amount", () => {
      expect(flagTypeLabel("unusual_amount")).toBe("Unusual Amount");
    });

    it("returns label for pattern_break", () => {
      expect(flagTypeLabel("pattern_break")).toBe("Pattern Break");
    });

    it("returns label for round_number_anomaly", () => {
      expect(flagTypeLabel("round_number_anomaly")).toBe(
        "Round Number Anomaly",
      );
    });
  });

  describe("confidenceLabel", () => {
    it("returns High for scores >= 0.7", () => {
      expect(confidenceLabel(0.7)).toBe("High");
      expect(confidenceLabel(0.9)).toBe("High");
      expect(confidenceLabel(1.0)).toBe("High");
    });

    it("returns Medium for scores >= 0.4 and < 0.7", () => {
      expect(confidenceLabel(0.4)).toBe("Medium");
      expect(confidenceLabel(0.5)).toBe("Medium");
      expect(confidenceLabel(0.69)).toBe("Medium");
    });

    it("returns Low for scores < 0.4", () => {
      expect(confidenceLabel(0.0)).toBe("Low");
      expect(confidenceLabel(0.3)).toBe("Low");
      expect(confidenceLabel(0.39)).toBe("Low");
    });
  });

  describe("formatAccount", () => {
    it("formats account with name using em dash", () => {
      expect(formatAccount("060000", "Geh\u00e4lter")).toBe(
        "060000 \u2014 Geh\u00e4lter",
      );
    });

    it("returns just the number when name is null", () => {
      expect(formatAccount("060000", null)).toBe("060000");
    });
  });
});
