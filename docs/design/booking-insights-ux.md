# Booking Insights — UX Design Reference

**Product:** Booking Insights  
**Version:** MVP  
**Date:** 2026-04-02

---

## 1. Design Principles

1. **Scannability first.** Users must know how many problems exist and where they are within 5 seconds of loading. Color and iconography carry information, not just decoration.
2. **Trust through consistency.** Financial tools must feel precise. Consistent number formatting and predictable patterns build confidence.
3. **Progressive disclosure.** Dashboard shows counts. List shows summaries. Detail shows full context. Never dump everything at once.
4. **Red flags win attention.** Critical issues must visually dominate. Clean bookings fade into the background so problems stand out.
5. **Zero ambiguity on actions.** Every interactive element must be clearly clickable. Every data point must be clearly readable.

---

## 2. Color System

### Brand Colors

```
Brand primary:      #006fd6   (Booking Insights blue — links, active states, primary buttons)
Brand primary dim:  #005ab0   (hover/pressed, 15% darker)
Brand primary tint: #e6f2fc   (selected rows, info backgrounds)
```

### Page Neutrals

```
Page background:  #f4f7fa   (off-white, cool tint)
Card surface:     #ffffff
Border:           #e2e6eb
Muted text:       #737880
Primary text:     #1a1a1a
```

### Semantic Status Colors

```
Critical:  text #dc2626  bg #fef2f2  border #fecaca   (red)
Warning:   text #d97706  bg #fffbeb  border #fde68a   (amber)
Clean:     text #16a34a  bg #f0fdf4  border #bbf7d0   (green)
```

### Design Decision: Light Mode Only

The Booking Insights brand is light-mode-first. Financial tools are a professional context — accountants work in Excel, not dark terminals. Dark mode is post-MVP.

### Design Decision: Row Tinting Communicates Severity

Table rows are tinted at the row level, not only via a badge column. This lets users scan severity without reading every badge.

```
Clean row:    white (default — no tint)
Warning row:  #fffbeb at 60% opacity + 3px left border amber-400
Critical row: #fef2f2 at 80% opacity + 3px left border red-500
```

Color is never the only signal — icons always accompany status colors for colorblind accessibility.

---

## 3. Page Architecture

### Shell Layout

```
┌──────────────────────────────────────────────────────┐
│  TOPBAR (48px) — logo left, user avatar right        │
├──────────────┬───────────────────────────────────────┤
│              │                                       │
│  SIDEBAR     │  MAIN CONTENT AREA                    │
│  (240px)     │  max-w-7xl, px-6 py-6                │
│              │                                       │
│  Overview    │  [Page title + subtitle]              │
│  Bookings    │  [border-b divider]                   │
│  ─────────   │                                       │
│  Settings    │  [Content]                            │
│              │                                       │
└──────────────┴───────────────────────────────────────┘
```

Every page has a title block at the top of the content area: large heading, small subtitle, and a horizontal rule before the content below.

### Design Decision: URL-Driven Filters

Active filters are stored in the URL as query params (e.g., `/bookings?status=critical&account=060000`). This means:

- Sharing a URL shares the exact filtered view — useful for async collaboration
- The browser back button restores filter state
- The sidebar "Bookings" link always goes to the unfiltered list

### View Map

| Route                     | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| `/`                       | Dashboard — health summary, KPI cards, charts  |
| `/bookings`               | Booking List — searchable, filterable table    |
| `/bookings/[document_id]` | Booking Detail — full context for one document |

---

## 4. View Wireframes

### Dashboard Overview

```
Booking Insights
168 documents · 425 lines · Jan–Feb 2025
───────────────────────────────────────────────────────

[Total Docs] [Critical Flags] [Warnings] [Clean]
   168            8              14         146

[Flag Distribution by Type — horizontal bar chart]  [Top Flagged Accounts]

[Booking Activity + Flags Over Time — line chart]

[Recent Critical Flags — table, 5 rows, link to full list]
```

### Booking List

```
Bookings                                    [Export CSV]
168 documents — 22 flagged
────────────────────────────────────────────────────────

[Search...]  [Date Range]
Status: [All] [Critical] [Warning] [Clean]
Flag: [All]  Account: [All]  Amount: [Min]–[Max]  [Reset]

Showing 22 of 168  ·  Sorted by: Date (newest first)

  Status | Date       | Doc Nr      | Description         | Account | Amount
  ───────────────────────────────────────────────────────────────────────────
  CRIT   | 15.02.2025 | 5000000142  | Lieferant Müller    | 060000  | 1,404.17 EUR
  CRIT   | 14.02.2025 | 5000000141  | Lieferant Müller    | 060000  | 1,404.17 EUR
  WARN   | 10.02.2025 | 5000000098  | Reisekosten Feb     | 070500  | 3,840.00 EUR
         | 08.02.2025 | 5000000085  | Büromaterial        | 070300  |   127.50 EUR
```

### Booking Detail

```
← Back to Bookings

5000000142 — Lieferant Müller GmbH                    [CRITICAL]
15.02.2025

LEFT COLUMN (60%)                     RIGHT COLUMN (40%)
┌─────────────────────────────┐       ┌──────────────────────────┐
│ Booking Data (key-value)    │       │ Related Bookings          │
│ Document ID, date, account, │       │ (duplicate link first,    │
│ amount, doc type, tax code, │       │ then same-account list)   │
│ cost center, vendor, text   │       ├──────────────────────────┤
├─────────────────────────────┤       │ Account Summary           │
│ Why was this flagged?       │       │ (total docs, flagged %,   │
│ [flag type + explanation]   │       │ avg amount, vs. avg)      │
│ Confidence: High            │       └──────────────────────────┘
│ [Mark as False Positive]    │
│ [Confirm as Duplicate]      │
└─────────────────────────────┘

FULL WIDTH:
┌────────────────────────────────────────────────────────┐
│ Document Lines (all JournalEntryLine rows for doc)     │
│ Line | Account | Debit/Credit | Amount | Cost Center   │
│ Balance: 0.00 EUR ✓                                    │
└────────────────────────────────────────────────────────┘
```

**Design decision — document lines instead of activity log:** Accountants need the full double-entry context to judge a booking. Document lines show all related journal entry rows and verify the document balances to zero. An activity log would require a persistence layer and is less actionable.

**MVP scope note:** "Mark as False Positive" and "Confirm as Duplicate" buttons are shown for target UX illustration only. They require a persistence layer and are post-MVP. The detail view is read-only in MVP.

---

## 5. Data Display Patterns

These are conventions developers must apply consistently across the product.

### Amounts

```
Rule: always 2 decimal places, always show currency code, always right-align.
Apply tabular-nums (font-variant-numeric: tabular-nums) to all amount columns.

Positive:   12,500.00 EUR    text-neutral-900
Negative:  -50,000.00 EUR    text-red-600
Zero:           0.00 EUR     text-neutral-400 (muted)
```

### Dates

```
Table / compact:  31.03.2026               (German locale DD.MM.YYYY)
Detail / verbose: 31. März 2026
Timestamps:       31.03.2026, 09:41 Uhr
```

### Account Numbers

```
Format:      "060000 — Gehälter"   (number + em dash + name from GL_ACCOUNTS)
Fallback:    "071100"              (number only if name not in master)
Font:        monospace for the number portion
```

### Flag Type Labels

```
duplicate_entry      → "Duplicate Entry"
missing_counterpart  → "Missing Counterpart"
unusual_amount       → "Unusual Amount"
pattern_break        → "Pattern Break"
round_number_anomaly → "Round Number Anomaly"
```

### Confidence Levels

Show as text label, not a raw decimal — accountants need judgment language, not probability scores.

```
> 0.8:    "High confidence"
0.5–0.8:  "Medium confidence"
< 0.5:    "Low confidence"
```

### Null / Missing Values

```
Never show "null", "undefined", or empty string.
Missing text or amount:  — (em dash, text-neutral-300)
Missing account:         "(No account)" in italic text-neutral-400
```

---

## 6. Key UX Decisions Summary

| Decision                           | Rationale                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------- |
| Light mode only                    | Brand is light-first; financial tools are a professional desktop context                      |
| Row tinting by severity            | Lets users scan severity without reading every badge; complements, not replaces, badge column |
| URL-driven filter state            | Enables async collaboration and reliable browser back behavior                                |
| Document lines over activity log   | Double-entry context is more actionable for accountants than an event timeline                |
| Actions as post-MVP                | Persisting user decisions requires a database; read-only analysis is the MVP scope            |
| Desktop-first, mobile out of scope | Target users (accountants) work on desktops; mobile blocked with a polite redirect message    |
| Confidence as text label           | Accountants need judgment language ("High confidence"), not probability decimals              |
| Monospace for numbers/IDs          | Document IDs and account numbers are scanned for patterns — alignment aids recognition        |
