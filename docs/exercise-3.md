# Exercise 3: Booking Manual / Rule Suggestions

## Goal

Derive a compact set of booking rules from existing transaction data. Each rule describes how typical business cases are booked (e.g., which account/tax-code/cost-center combinations are common) and serves as a data-driven "booking manual."

## What We Generate

### 1. Account + Tax Code Rules

**Method:** Group lines by GL account. For accounts with >=5 lines where tax_code is non-null, find the dominant tax code. If one covers >=80%, emit a rule.

**Example:** "Account 070000 (Miete) uses tax code V19 — 47 of 50 bookings (94%)."

### 2. Account + Cost Center Rules

**Method:** Same structure as above, but for cost_center assignments.

**Example:** "Account 060000 (Gehälter) uses cost center 1000 — 100% of bookings."

### 3. Document Type + Account Range Rules

**Method:** Group lines by document type. Find the most common account range per type. Threshold >=70%.

**Example:** "Document type KR typically uses Betriebsaufwand accounts."

### 4. Recurring Text Rules

**Method:** Normalize booking texts (strip dates/numbers). Group by normalized text. For texts appearing in >=3 distinct months with the same account >=80% of the time, emit a rule.

**Example:** "Miete is posted monthly to account 070000."

### 5. Amount Range Rules

**Method:** Group by GL account. For accounts with >=10 lines, compute the interquartile range (Q1-Q3). Skip if coefficient of variation > 1.5.

**Example:** "Account 070000 typically has amounts between 500.00 and 2000.00 EUR."

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/lib/bookings/rule.types.ts` | TypeScript types (BookingRule, RuleEvidence, RuleScope, BookingManual) |
| `src/lib/bookings/rule-miner.ts` | Five miners + orchestrator |
| `src/lib/bookings/rule-miner.test.ts` | Tests for all miners |
| `src/components/manual-rule-card.tsx` | Server component for rule card display |
| `src/app/(app)/manual/page.tsx` | Booking Manual page |
| `src/app/(app)/manual/loading.tsx` | Skeleton loading state |

### Key Design Decisions

- **Rules are separate from flags** — rules describe "how things should be" (prescriptive), flags describe "what looks wrong" (diagnostic). No new flag types.
- **Rules are fully data-driven** — different customer data produces different rules. Only the thresholds (minimum sample size, concentration) are fixed.
- **Confidence is adjusted for sample size** — a 100% concentration on 5 lines ranks lower than 95% on 50 lines, using `concentration * sqrt(sampleSize / 30)`.
- **Top 10 rules** sorted by adjusted confidence, filtered below 0.4 minimum.

## Thresholds

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Min lines for tax/cost center rule | 5 | Need enough data for a meaningful pattern |
| Min concentration (dominant value) | 80% | Below this, no clear dominant pattern |
| Min concentration (document type) | 70% | Document types are broader, lower bar |
| Min distinct months (recurring) | 3 | Must recur across months to be a pattern |
| Max coefficient of variation (amounts) | 1.5 | Skip highly dispersed distributions |
| Min confidence (final filter) | 0.4 | After sample-size adjustment |
| Max rules | 10 | Keep the manual compact |

## Pull Request & Commit History

### PR [#2](https://github.com/farambis/booking-insights/pull/2) — Add booking manual with rule mining engine (merged)

Initial implementation of all five miners, orchestrator, service integration, and UI (manual page with rule cards, sidebar entry, loading skeleton).

**Issues identified during review:**

- **confidence and supportRatio were identical** — ranking by `confidence * supportRatio` was effectively `confidence²`, not accounting for sample size. Fixed by introducing `adjustedConfidence()` that penalizes small samples.
- **Violation link broken for non-account rules** — always passed `flagTypes=pattern_break` with only `glAccount`, leading to unrelated results for cost center, text, or document type rules. Fixed by removing hardcoded flag type and passing available scope fields.
- **Evidence document IDs lacked font-mono** — minor scannability issue.

### Follow-up commits

1. **`f4b319a`** — Fix: add font-mono to evidence document IDs in manual rule cards.

2. **`97d3b51`** — Separate confidence from supportRatio. Confidence now uses `adjustedConfidence(concentration, sampleSize)` which penalizes small samples. Ranking uses adjusted confidence directly. MIN_CONFIDENCE lowered to 0.4 to account for the adjustment.

3. **`100a09a`** — Fix violation link to use available filters per rule scope. Removed hardcoded `flagTypes=pattern_break`. Links now filter by account and/or search text. Note: costCenter and documentType filters are not yet supported in the bookings filter system.
