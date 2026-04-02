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

| File | Purpose |
|------|---------|
| `src/lib/bookings/levenshtein.ts` | Pure Levenshtein distance function |
| `src/lib/bookings/levenshtein.test.ts` | Tests for Levenshtein |
| `src/lib/bookings/text-anomaly-detector.ts` | Three detection rules + orchestrator |
| `src/lib/bookings/text-anomaly-detector.test.ts` | Tests for each detection rule |

### Modified Files

| File | Change |
|------|--------|
| `src/lib/bookings/booking.types.ts` | Add `text_typo`, `unusual_text_account`, `text_duplicate_posting` to `FlagType` |
| `src/lib/bookings/format.ts` | Add display labels for new flag types |
| `src/lib/bookings/local-booking-service.ts` | Wire detector into `transformAndFlag` (replace empty `flagMap`) |
| `src/app/(app)/bookings/page.tsx` | Add new flag types to filter bar options |

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

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Levenshtein max distance | 3 | Beyond 3, strings are too different to be typos |
| Min text occurrences for combo detection | 3 | Need enough data points to establish a pattern |
| Unusual combo threshold | < 10% of text's total | Distinguishes rare from common pairings |
| Date proximity for duplicates | 2 days | Accounting duplicates are typically posted within a day or two |
| Signature match | Exact | Start strict, relax to Jaccard >= 0.8 if needed |
