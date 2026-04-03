import { describe, expect, it } from "vitest";
import type { BookingFlag } from "./booking.types";
import { type FlagMap, flagKey, addFlag } from "./flag-utils";

describe("flagKey", () => {
  it("returns documentId:lineId format", () => {
    expect(flagKey("D1", 1)).toBe("D1:1");
  });

  it("handles multi-digit line IDs", () => {
    expect(flagKey("DOC-123", 42)).toBe("DOC-123:42");
  });
});

describe("addFlag", () => {
  it("creates a new entry when key does not exist", () => {
    const map: FlagMap = new Map();
    const flag: BookingFlag = {
      type: "text_typo",
      severity: "warning",
      explanation: "test",
      confidence: 0.9,
      detectedAt: "2025-01-01T00:00:00.000Z",
      relatedDocumentId: null,
    };

    addFlag(map, "D1:1", flag);

    expect(map.get("D1:1")).toEqual([flag]);
  });

  it("appends to existing flags for the same key", () => {
    const map: FlagMap = new Map();
    const flag1: BookingFlag = {
      type: "text_typo",
      severity: "warning",
      explanation: "first",
      confidence: 0.9,
      detectedAt: "2025-01-01T00:00:00.000Z",
      relatedDocumentId: null,
    };
    const flag2: BookingFlag = {
      type: "duplicate_booking",
      severity: "critical",
      explanation: "second",
      confidence: 0.8,
      detectedAt: "2025-01-01T00:00:00.000Z",
      relatedDocumentId: "D2",
    };

    addFlag(map, "D1:1", flag1);
    addFlag(map, "D1:1", flag2);

    expect(map.get("D1:1")).toEqual([flag1, flag2]);
  });

  it("keeps separate keys independent", () => {
    const map: FlagMap = new Map();
    const flag1: BookingFlag = {
      type: "text_typo",
      severity: "warning",
      explanation: "a",
      confidence: 0.9,
      detectedAt: "2025-01-01T00:00:00.000Z",
      relatedDocumentId: null,
    };
    const flag2: BookingFlag = {
      type: "duplicate_booking",
      severity: "critical",
      explanation: "b",
      confidence: 0.8,
      detectedAt: "2025-01-01T00:00:00.000Z",
      relatedDocumentId: null,
    };

    addFlag(map, "D1:1", flag1);
    addFlag(map, "D2:1", flag2);

    expect(map.get("D1:1")).toEqual([flag1]);
    expect(map.get("D2:1")).toEqual([flag2]);
  });
});
