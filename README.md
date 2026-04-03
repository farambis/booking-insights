# Booking Insights

Financial analysis app based on SAP-style journal entry data. Detects red flags, anomalies, and potentially incorrect bookings.

**Live Demo:** https://booking-insights-farambis-projects.vercel.app

## Booking Data

The app works with generated SAP FI journal entries. Details on the data model, generation, and chart of accounts are in [src/lib/data/README.md](src/lib/data/README.md).

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

### Booking Manual / Rule Suggestions

Automatically derived booking rules from transaction data (account+tax code, account+cost center, document type+account range, recurring texts, amount ranges). Rule violations are detected as a separate flag type. Details in [docs/exercise-3.md](docs/exercise-3.md).

## Exercise 3: Context Engineering

Architecture sketch for context-based explainability: not just showing numbers, but answering questions like "Why was this discount granted?" Two-tier retrieval (deterministic lookup + semantic search), evidence-first approach. Details in [docs/context-engineering.md](docs/context-engineering.md).
