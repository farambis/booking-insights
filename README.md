# Booking Insights

Financial analysis app based on SAP-style journal entry data. Detects red flags, anomalies, and potentially incorrect bookings.

**Live Demo:** https://booking-insights-farambis-projects.vercel.app

## Booking Data

The app works with generated SAP FI journal entries. Details on the data model, generation, and chart of accounts are in [src/lib/data/README.md](src/lib/data/README.md).

## Exercise 1: Booking Insights UI

A dashboard and investigation interface for analyzing booking data, built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS 4.

Three views: **Dashboard** (KPI cards, flag distribution chart, activity timeline, recent critical flags), **Booking List** (filterable/sortable table with URL-driven filter state), and **Booking Detail** (flag explanations with inline related documents, document lines with balance check, account context).

- [Architecture Decisions](docs/architecture.md) — data flow, key decisions (BookingService interface, URL-driven state, Server/Client boundaries, module-level caching), MVP vs. permanent
- [Technical Architecture](docs/design/booking-insights-architecture.md) — route structure, component overview, file tree
- [UX Design](docs/design/booking-insights-ux.md) — design principles, color system, page wireframes, data display conventions

## Exercise 2: Anomaly Detection & Duplicate Detection

The app detects suspicious bookings using multiple detectors that run once at startup against all journal entries. Each detector produces flags with a type, severity (critical/warning), confidence score, and human-readable explanation.

### How Flagging Works

```
journal-entries.json
        |
        v
  Detectors (parallel, independent):
  |-- Text anomalies (typos, unusual text-account combos, text duplicates)
  |-- Duplicate detection (multi-signal scoring across 9 criteria)
  |-- Pattern detection (unusual amounts, round numbers, pattern breaks)
  |-- Rule violations (derived from booking rules)
        |
        v
  Flags are merged per document + deduplicated
        |
        v
  BookingService (cached, serves dashboard + list + detail view)
```

**Flag types:**
- `duplicate_booking` — Multi-signal duplicate (amount + vendor + account + text + date)
- `text_typo` — Typo in booking text (Levenshtein distance)
- `unusual_text_account` — Unusual text-account combination
- `text_duplicate_posting` — Text-based duplicate (same signature, short time gap)
- `unusual_amount` — Amount deviates significantly from account average
- `round_number_anomaly` — Suspiciously round amount
- `pattern_break` — Booking on wrong debit/credit side
- `missing_counterpart` — Document without counterpart entry
- `rule_violation` — Violation of a derived booking rule

### PR [#1](https://github.com/farambis/booking-insights/pull/1) — Text-Based Anomaly Detection

Three detectors for booking text anomalies: typos via Levenshtein distance, unusual text-account combinations via frequency analysis, and text-based duplicate detection via document signatures.

**Key finding:** 99.8% false positive rate in the typo detector caused by date-suffixed booking texts ("Ausgangsrechnung 2025-01-15" vs "2025-01-16"). Resolved by normalizing texts: date suffixes are stripped before comparison.

### PR [#3](https://github.com/farambis/booking-insights/pull/3) — Multi-Signal Duplicate Booking Detection

Replaces basic text-signature duplicate detection with weighted scoring across 9 signals (amount, vendor/customer, GL account, contra account, posting date, booking text, document type, cost center, tax code).

**Key decision:** Amount match (≤0.50 EUR difference) is a required gate. Same vendor + same account without matching amount is normal business activity, not a duplicate. Confidence is shown as a percentage (not High/Medium/Low), and related documents are inlined in the flag card.

### PR [#2](https://github.com/farambis/booking-insights/pull/2) — Booking Manual / Rule Mining

Derives booking rules from transaction data to serve as a data-driven "booking manual." Five miners extract patterns: account+tax code rules, account+cost center rules, document type+account range rules, recurring text patterns, and amount range rules. Each rule has a confidence score adjusted for sample size. The top 10 rules are displayed on a dedicated `/manual` page.

Rules are separate from flags — they describe "how things should be" (prescriptive), while flags describe "what looks wrong" (diagnostic). However, `rule_violation` flags are emitted when bookings deviate from the derived rules.

**Key finding:** Initial confidence ranking was effectively `confidence²` because `confidence` and `supportRatio` were identical. Fixed by introducing `adjustedConfidence()` that penalizes small samples using `concentration * sqrt(sampleSize / 30)`.

## Exercise 3: Context Engineering

Architecture sketch for context-based explainability: not just showing numbers, but answering questions like "Why was this discount granted?" Two-tier retrieval (deterministic lookup + semantic search), evidence-first approach. Details in [docs/context-engineering.md](docs/context-engineering.md).
