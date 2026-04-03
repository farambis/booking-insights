import { describe, expect, it } from "vitest";
import { levenshteinDistance } from "./levenshtein";

describe("levenshteinDistance", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshteinDistance("Büromaterial", "Büromaterial")).toBe(0);
  });

  it("returns small distance for a transposition typo", () => {
    // "Büromateiral" has 'i' and 'r' swapped compared to "Büromaterial"
    expect(
      levenshteinDistance("Büromaterial", "Büromateiral"),
    ).toBeLessThanOrEqual(2);
  });

  it("returns the length of the other string when one is empty", () => {
    expect(levenshteinDistance("", "hello")).toBe(5);
    expect(levenshteinDistance("hello", "")).toBe(5);
  });

  it("returns 0 for two empty strings", () => {
    expect(levenshteinDistance("", "")).toBe(0);
  });

  it("returns large distance for completely different strings", () => {
    expect(levenshteinDistance("abc", "xyz")).toBe(3);
  });

  it("handles single character difference (substitution)", () => {
    expect(levenshteinDistance("kitten", "sitten")).toBe(1);
  });

  it("handles single character difference (insertion)", () => {
    expect(levenshteinDistance("abc", "abcd")).toBe(1);
  });

  it("handles single character difference (deletion)", () => {
    expect(levenshteinDistance("abcd", "abc")).toBe(1);
  });

  it("computes classic kitten/sitting example", () => {
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
  });
});
