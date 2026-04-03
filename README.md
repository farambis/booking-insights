# Booking Insights

Financial analysis app based on SAP-style journal entry data. Detects red flags, anomalies, and potentially incorrect bookings.

**Live Demo:** https://booking-insights-farambis-projects.vercel.app

## Assumptions

- **Account ranges:** The chart of accounts follows a German mid-size company structure with 6-digit zero-padded GL accounts in 9 ranges (010000–019999 Assets through 090000–099999 Bank & Cash). All flag detection rules (expected debit/credit side, pattern breaks, amount ranges) assume these ranges. See [`src/lib/data/account-master.ts`](src/lib/data/account-master.ts) for the full definition.
- **Five issues + two fixes per feature:** Each exercise PR identifies at least 5 issues during code/UX/architecture review, of which at least 2 are fixed in follow-up commits. The review comments are documented on the PRs, and the fix commits are linked in the Exercise 2 section below.

## Booking Data

The app works with generated SAP FI journal entries. Details on the data model, generation, and chart of accounts are in [src/lib/data/README.md](src/lib/data/README.md).

## Exercise 1: Booking Insights UI

A dashboard and investigation interface for analyzing booking data, built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS 4.

Three views: **Dashboard** (KPI cards, flag distribution chart, activity timeline, recent critical flags), **Booking List** (filterable/sortable table with URL-driven filter state), and **Booking Detail** (flag explanations with inline related documents, document lines with balance check, account context).

- [Architecture Decisions](docs/architecture.md) — data flow, key decisions (BookingService interface, URL-driven state, Server/Client boundaries, module-level caching), MVP vs. permanent
- [Technical Architecture](docs/design/booking-insights-architecture.md) — route structure, component overview, file tree
- [UX Design](docs/design/booking-insights-ux.md) — design principles, color system, page wireframes, data display conventions

## Exercise 2: Anomaly Detection, Duplicate Detection & Booking Manual

Each PR was reviewed by code-reviewer, UX-designer, and software-architect agents. All review comments are available directly on the PRs. CI pipeline (`.github/workflows/ci.yml`) runs lint, typecheck, and tests on every push and pull request.

### Flagging

The app detects suspicious bookings using multiple independent detectors that run once at startup against all journal entries. Each detector produces flags with a type, severity (critical/warning), confidence score, and human-readable explanation.

```
journal-entries.json
        |
        v
  Detectors (parallel, independent):
  |-- Text anomalies (typos, unusual text-account combos, text duplicates)
  |-- Duplicate detection (multi-signal scoring across 9 criteria)
  |-- Pattern detection (unusual amounts, round numbers, pattern breaks)
        |
        v
  Flags are merged per document + deduplicated
        |
        v
  BookingService (cached, serves dashboard + list + detail view)
```

**Detectors and what they catch:**

**Text anomaly detector** (`text-anomaly-detector.ts`) — Analyzes booking text strings across all journal entries:
- `text_typo` — Compares all unique booking texts pairwise using Levenshtein distance. Texts with distance 1-3 are flagged as potential typos. The less frequent text is the suspected error. Texts are normalized first (trailing dates and numbers stripped) to avoid false positives on date-suffixed entries.
- `unusual_text_account` — Builds frequency maps of which GL accounts each booking text appears on. If a text has 3+ occurrences and a particular account holds less than 10% of them, that combination is flagged as unusual.
- `text_duplicate_posting` — Creates a document signature (sorted set of booking text + GL account tuples) for each document. Documents with identical signatures posted within 2 days of each other are flagged as potential double postings.

**Duplicate detector** (`duplicate-detector.ts`) — Multi-signal weighted scoring across 9 criteria per document pair:
- Amount (0.25 weight, **required gate** — must match within 0.50 EUR)
- Vendor/Customer ID (0.20), GL account (0.15), contra account (0.10)
- Posting date proximity (0.10 — 0 days = 1.0, decreasing to 0.0 beyond 5 days)
- Booking text similarity (0.10 — exact match or Levenshtein distance ≤3)
- Document type (0.05), cost center (0.03), tax code (0.02)

Gate rules: amount match required (same vendor + same account without same amount is normal business), invoice+payment pairs (KR+KZ, DR+DZ) excluded, same document excluded. Confidence ≥0.75 = critical, ≥0.35 = warning.

**Pattern detectors** (`pattern-detectors.ts`) — Structural anomalies in the booking data:
- `unusual_amount` — Amount exceeds 2x the account's average across all bookings
- `round_number_anomaly` — Suspiciously round amounts (divisible by 1000) on accounts that normally have variable amounts
- `pattern_break` — Booking posted on the wrong debit/credit side for its account category (e.g., revenue account on debit side), or personnel expense with a customer reference
- `missing_counterpart` — Document with only debit or only credit entries (violates double-entry bookkeeping)

### Booking Manual / Rule Mining

Separately from flagging, the app derives booking rules from transaction data to serve as a data-driven "booking manual." Rules describe "how things should be" (prescriptive), while flags describe "what looks wrong" (diagnostic).

**Five rule miners** (`rule-miner.ts`) extract patterns:
- **Account + tax code** — For accounts with ≥5 lines, identifies the dominant tax code (≥80% concentration). Example: "Account 070000 (Miete) uses tax code V19 in 94% of bookings."
- **Account + cost center** — Same approach for cost center assignments. Example: "Account 060000 (Gehaelter) always uses cost center 1000."
- **Document type + account range** — Groups by document type, finds the dominant account range on the debit side (≥70%). Example: "KR documents typically debit operating expense accounts."
- **Recurring text** — Normalizes booking texts, groups by text pattern. Texts appearing in ≥2 distinct months with the same account ≥80% of the time are identified as recurring. Example: "Miete is posted monthly to account 070000."
- **Amount range** — For accounts with ≥10 lines, computes the interquartile range (Q1-Q3). Skips accounts with high variance (coefficient of variation >1.5). Example: "Account 070000 typically has amounts between 500 and 2,000 EUR."

Rules are ranked by adjusted confidence (`concentration * sqrt(sampleSize / 30)`) to penalize small samples. The top rules are displayed on the `/manual` page. Violations of derived rules are detected separately and shown on a per-rule violations page (`/manual/[ruleId]`).

### PR [#1](https://github.com/farambis/booking-insights/pull/1) — Text-Based Anomaly Detection

Three detectors for booking text anomalies: typos via Levenshtein distance, unusual text-account combinations via frequency analysis, and text-based duplicate detection via document signatures.

**Key finding:** 99.8% false positive rate in the typo detector caused by date-suffixed booking texts ("Ausgangsrechnung 2025-01-15" vs "2025-01-16").

Follow-up fixes:

- [`9fb8b9a`](https://github.com/farambis/booking-insights/commit/9fb8b9a) — Add new text flag types to `VALID_FLAG_TYPES` whitelist (filter dropdown was silently ignoring them)
- [`cd5fc78`](https://github.com/farambis/booking-insights/commit/cd5fc78) — Normalize booking texts before comparison, stripping date suffixes. Eliminated all 1,221 false positives while preserving 2 genuine typo detections

### PR [#3](https://github.com/farambis/booking-insights/pull/3) — Multi-Signal Duplicate Booking Detection

Replaces basic text-signature duplicate detection with weighted scoring across 9 signals. See "Duplicate detector" above for the full signal list and weights.

**Key decision:** Amount match (≤0.50 EUR difference) is a required gate. Same vendor + same account without matching amount is normal business activity, not a duplicate.

Follow-up fixes:

- [`b36a710`](https://github.com/farambis/booking-insights/commit/b36a710) — Show confidence as percentage instead of High/Medium/Low tiers (review found that 0.76 and 0.99 looked identical)
- [`e1c64b3`](https://github.com/farambis/booking-insights/commit/e1c64b3) — Inline related document info in flag card (review found accountants had to click through to see the other document)

### PR [#2](https://github.com/farambis/booking-insights/pull/2) — Booking Manual / Rule Mining

Five rule miners + orchestrator, rule violation detection, and a dedicated UI (`/manual` page with rule cards, `/manual/[ruleId]` for per-rule violations). See "Booking Manual / Rule Mining" above for the full approach.

**Key finding:** Initial confidence ranking was effectively `confidence²` because `confidence` and `supportRatio` were identical.

Follow-up fixes:

- [`f4b319a`](https://github.com/farambis/booking-insights/commit/f4b319a) — Add font-mono to evidence document IDs for scannability
- [`97d3b51`](https://github.com/farambis/booking-insights/commit/97d3b51) — Separate confidence from supportRatio; introduce `adjustedConfidence()` that penalizes small samples
- [`100a09a`](https://github.com/farambis/booking-insights/commit/100a09a) — Fix violation link to use available filters per rule scope instead of hardcoded `flagTypes=pattern_break`

## Exercise 3: Context Engineering

Architecture sketch for context-based explainability: not just showing numbers, but answering questions like "Why was this discount granted?" Two-tier retrieval (deterministic lookup + semantic search), evidence-first approach. Details in [docs/context-engineering.md](docs/context-engineering.md).
