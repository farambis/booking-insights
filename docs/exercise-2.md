# Exercise 2: Text-Based Anomaly Detection

## Goal

Detect suspicious booking texts in SAP journal entry data using string comparison and frequency analysis. No ML, no external services, no dictionaries -- purely structural analysis of the existing dataset.

## What We Detect

### 1. Typos / Near-Duplicates

**Method:** Pairwise Levenshtein distance on all unique booking texts.

- Extract unique `booking_text` values with their occurrence counts
- Compare every pair (with ~40 unique texts this is ~780 comparisons)
- Skip pairs where the length difference exceeds the distance threshold (optimization: Levenshtein distance >= |len(a) - len(b)|)
- Flag pairs with distance 1-3; the less frequent text is the suspected typo
- Confidence inversely proportional to distance (1 -> 0.9, 2 -> 0.7, 3 -> 0.5)
- Severity: `warning`

**Example:** "Buromateiral" flagged as likely typo of "Buromaterial" (distance 1).

### 2. Unusual Text-Account Combinations

**Method:** Frequency maps of text-to-account associations.

- Build a map: `booking_text -> Map<gl_account, count>`
- For each text, compute total occurrences across all accounts
- A text-account pair is flagged when:
  - The text has >= 3 total occurrences (enough data to establish a pattern)
  - This account holds < 10% of that text's total occurrences
- Confidence: `1 - (accountCount / totalCount)`
- Severity: `warning`

**Example:** "Lieferant Mueller GmbH" appears 14x on liability/expense accounts but 1x on a personnel account -- the personnel posting is flagged.

### 3. Suspiciously Similar Documents (Text-Based)

**Method:** Document signature comparison.

- For each document, create a signature: sorted set of `(booking_text, gl_account)` tuples
- Compare document pairs where:
  - Signatures match exactly (same set of text + account combinations)
  - Posting dates are within 2 calendar days
- Severity: `critical` (potential double posting)
- Confidence: 0.8

**Example:** Two documents posted 1 day apart with identical booking texts to the same accounts are flagged as a possible double posting.

## Architecture

### New Files

| File                                             | Purpose                              |
| ------------------------------------------------ | ------------------------------------ |
| `src/lib/bookings/levenshtein.ts`                | Pure Levenshtein distance function   |
| `src/lib/bookings/levenshtein.test.ts`           | Tests for Levenshtein                |
| `src/lib/bookings/text-anomaly-detector.ts`      | Three detection rules + orchestrator |
| `src/lib/bookings/text-anomaly-detector.test.ts` | Tests for each detection rule        |

### Modified Files

| File                                        | Change                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/lib/bookings/booking.types.ts`         | Add `text_typo`, `unusual_text_account`, `text_duplicate_posting` to `FlagType` |
| `src/lib/bookings/format.ts`                | Add display labels for new flag types                                           |
| `src/lib/bookings/local-booking-service.ts` | Wire detector into `transformAndFlag` (replace empty `flagMap`)                 |
| `src/app/(app)/bookings/page.tsx`           | Add new flag types to filter bar options                                        |

### Data Flow

```
journal-entries.json
        |
        v
  JournalEntryLine[]
        |
        +-----> detectTextAnomalies() --> Map<"docId:lineId", BookingFlag[]>
        |                                          |
        v                                          v
  transformAndFlag() <--- uses flagMap --- (passed into transformAndFlag)
        |
        v
  BookingDetail[] (with flags populated)
        |
        v
  bookingService (cached at module scope)
```

Detection runs once at app startup. Results are cached for the lifetime of the server process, following the same pattern as the existing `allBookings` singleton.

## Implementation Plan

1. **Levenshtein utility** -- TDD: tests first, then the implementation
2. **Detector module** -- TDD: test each rule with fixture data, then implement
3. **Type extensions** -- Add new `FlagType` values and format labels
4. **Service wiring** -- One-line change in `local-booking-service.ts`
5. **Verification** -- Confirm the planted anomalies (4 typos, 3 double postings, 3 unusual combos) are detected

## Thresholds Summary

| Parameter                                | Value                 | Rationale                                                      |
| ---------------------------------------- | --------------------- | -------------------------------------------------------------- |
| Levenshtein max distance                 | 3                     | Beyond 3, strings are too different to be typos                |
| Min text occurrences for combo detection | 3                     | Need enough data points to establish a pattern                 |
| Unusual combo threshold                  | < 10% of text's total | Distinguishes rare from common pairings                        |
| Date proximity for duplicates            | 2 days                | Accounting duplicates are typically posted within a day or two |
| Signature match                          | Exact                 | Start strict, relax to Jaccard >= 0.8 if needed                |

## Pull Request & Commit History

### PR [#1](https://github.com/farambis/booking-insights/pull/1) — Add text-based anomaly detection for booking texts (closed)

Initial implementation of all three detection rules, wired into the existing flag engine. Follow-up fixes were applied as separate commits.

**Known issues identified during code review:**

- **99.8% false positive rate in typo detector** — date-suffixed texts like "Ausgangsrechnung 2025-01-15" vs "2025-01-16" differ by 1-2 characters (the date digits), causing 1,221 false positive pairs out of 1,223 total.
- **Missing flag types in filter whitelist** — new flag types were not added to `VALID_FLAG_TYPES` in `filter-params.ts`, so the flag dropdown filter silently ignored them.
- **Frozen timestamp** — `detectedAt` set at module scope instead of per detection call.
- **Double-flagging** — a line close to two different texts gets multiple `text_typo` flags.
- **Singleton heuristic** — when both texts in a pair appear only once, tie-breaking is arbitrary.

### Follow-up commits

1. **`9fb8b9a`** — Fix: add new text flag types to `VALID_FLAG_TYPES` whitelist. The three new types (`text_typo`, `unusual_text_account`, `text_duplicate_posting`) were missing from the URL parameter parser, so selecting them in the flag dropdown had no effect.

2. **`cd5fc78`** — Normalize booking texts before comparison to reduce false positives. Added `normalizeForComparison()` which strips trailing ISO dates and numbers before Levenshtein comparison. Texts like "Ausgangsrechnung 2025-01-15" and "Ausgangsrechnung 2025-01-16" now normalize to the same base string and are skipped. Same normalization applied to duplicate posting signatures. Eliminated all 1,221 false positives while preserving the 2 genuine typo detections.

### PR [#3](https://github.com/farambis/booking-insights/pull/3) — Add multi-signal duplicate booking detection (merged)

Replaced the basic text-signature-only duplicate detection with a multi-signal weighted scoring engine (`duplicate-detector.ts`). Scores 9 signals (amount, vendor/customer, GL account, contra account, posting date, booking text via Levenshtein, document type, cost center, tax code) with configurable weights. Amount match (≤0.50 EUR) is a required gate — same vendor + same account without matching amount is not flagged.

**Review findings and follow-up fixes:**

1. **Confidence shown as percentage** — Review found that "High/Medium/Low" tier labels discard useful information (a score of 0.76 and 0.99 looked identical). Changed `FlagExplanationCard` to show confidence as percentage (e.g., "87%") with color coding: red ≥75%, amber ≥50%, neutral <50%. This lets accountants calibrate their own response to the confidence level. Removed the `confidenceLabel` indirection from the detail page.

2. **Related document inlined in flag card** — Review found that accountants had to click through to see the related document's details. Added an inline preview card inside `FlagExplanationCard` showing the related document's ID, description, posting date, amount, and account. The card is clickable for full navigation. Falls back to a plain link when document info is not available.

---

## Part 3: Booking Manual / Rule Suggestions

Automatically derived booking rules from transaction data. Details see [exercise-3.md](exercise-3.md).
