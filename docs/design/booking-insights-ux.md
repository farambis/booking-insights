# Booking Insights — UX Design Document

**Product:** Booking Insights  
**Feature:** Booking Insights (Buchungsdaten-Analyse)  
**Version:** MVP  
**Date:** 2026-04-02  
**Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Page Architecture](#4-page-architecture)
5. [View 1: Dashboard Overview](#5-view-1-dashboard-overview)
6. [View 2: Booking List](#6-view-2-booking-list)
7. [View 3: Booking Detail](#7-view-3-booking-detail)
8. [Component Inventory](#8-component-inventory)
9. [User Flows](#9-user-flows)
10. [Data Display Patterns](#10-data-display-patterns)
11. [State Specifications](#11-state-specifications)
12. [Responsive Behavior](#12-responsive-behavior)

---

## 1. Design Principles

These principles are ordered by priority for this specific product. The user is an accountant or finance analyst who needs to find problems fast, not a developer browsing a product demo.

1. **Scannability first.** At a glance, users must know how many problems exist and where they are. Color and iconography carry information, not just decoration.
2. **Trust through consistency.** Financial data tools must feel precise. Pixel-perfect alignment, consistent number formatting, and predictable patterns build confidence.
3. **Progressive disclosure.** The dashboard shows counts. The list shows summaries. The detail shows full context. Never dump everything at once.
4. **Red flags win attention.** Critical issues must visually dominate. A clean booking should fade into the background so problems stand out.
5. **Zero ambiguity on actions.** Every interactive element must be clearly clickable. Every data point must be clearly readable.

---

## 2. Color System

### Source Analysis

The Booking Insights brand (booking-insights.net) uses a light-mode design with:

- **Logo:** Near-black `#1f1f1f` on white — bold, geometric, clean
- **Primary brand color:** A confident blue — `hsl(207 100% 41%)` which converts to `#006fd6`
- **Background:** Off-white with a cool tint — `hsl(210 29% 97%)` which converts to `#f4f7fa`
- **Text:** Near-black `hsl(0 0% 10%)` which converts to `#1a1a1a`
- **Tone:** Professional, minimal, data-forward. Not corporate-gray. Not startup-colorful. Sharp and trustworthy.

### Design Decision: Light Mode Only for MVP

The booking-insights.net site is light-mode-first. For a financial data tool, light mode is also the professional standard (accountants work in Excel, not dark-mode terminals). Dark mode is a post-MVP concern.

### Color Palette

#### Brand Colors

```
--color-brand-primary:     #006fd6   /* hsl(207 100% 41%) — Booking Insights blue */
--color-brand-primary-dim: #005ab0   /* hover/pressed state, 15% darker */
--color-brand-primary-tint:#e6f2fc   /* light blue tint for selected rows, info backgrounds */
```

#### Neutral Scale (warm-neutral, not cool-gray)

```
--color-neutral-0:    #ffffff   /* pure white — card surfaces */
--color-neutral-50:   #f4f7fa   /* page background — off-white with cool tint */
--color-neutral-100:  #eef1f5   /* subtle dividers, hover states on list rows */
--color-neutral-200:  #e2e6eb   /* borders, input outlines */
--color-neutral-300:  #c8cdd5   /* disabled borders */
--color-neutral-500:  #737880   /* secondary/muted text, metadata labels */
--color-neutral-700:  #4a4e55   /* secondary text on white */
--color-neutral-900:  #1a1a1a   /* primary text */
```

#### Semantic Colors — Flag States

These are the most critical colors in the system. They must be distinct, accessible, and consistent.

```
/* Clean — no issues */
--color-status-clean:       #16a34a   /* green-600 */
--color-status-clean-bg:    #f0fdf4   /* green-50 */
--color-status-clean-border:#bbf7d0   /* green-200 */

/* Warning — anomaly, worth investigating */
--color-status-warning:     #d97706   /* amber-600 */
--color-status-warning-bg:  #fffbeb   /* amber-50 */
--color-status-warning-border:#fde68a /* amber-200 */

/* Critical — red flag, likely incorrect */
--color-status-critical:    #dc2626   /* red-600 */
--color-status-critical-bg: #fef2f2   /* red-50 */
--color-status-critical-border:#fecaca/* red-200 */

/* Info — informational annotation */
--color-status-info:        #2563eb   /* blue-600 */
--color-status-info-bg:     #eff6ff   /* blue-50 */
--color-status-info-border: #bfdbfe   /* blue-200 */
```

#### Table Row Tints

Row-level tinting communicates severity without badges taking up space.

```
Row — clean:    background: white (default, no tint)
Row — warning:  background: #fffbeb at 60% opacity (very subtle amber wash)
Row — critical: background: #fef2f2 at 80% opacity (visible red wash)
```

### Color Accessibility Notes

- All semantic colors meet WCAG AA contrast against white (4.5:1 minimum for text sizes used)
- Never use color as the only indicator — always pair with an icon or text label
- Red/green distinction is the most common colorblindness issue; the icons (triangle, circle, X) must carry the meaning independently of color

---

## 3. Typography

Booking Insights's site uses a geometric sans-serif feel. For the app, Geist Sans (already configured in globals.css) is the correct choice — it is legible at small sizes in data tables.

### Type Scale

```
text-xs    (12px): table metadata, secondary labels, timestamps
text-sm    (14px): table body text, filter labels, badges
text-base  (16px): body copy, sidebar nav items
text-lg    (18px): card headings, section titles
text-xl    (20px): page sub-headings
text-2xl   (24px): KPI values, large metric numbers
text-3xl   (30px): primary KPI (total bookings count)
```

### Weight Conventions

```
font-normal   (400): table data cells, descriptions
font-medium   (500): labels, nav items, secondary headings
font-semibold (600): card titles, KPI labels, badge text
font-bold     (700): critical numbers, primary KPI values
```

### Number Formatting

All monetary amounts use tabular numbers for column alignment. Apply `font-variant-numeric: tabular-nums` (Tailwind: `tabular-nums`) to any column containing amounts or counts.

---

## 4. Page Architecture

### Layout Shell

The app uses a sidebar + main content layout. This is consistent with booking-insights.net's implied product structure and provides room for navigation as features grow.

```
┌─────────────────────────────────────────────────────────────────┐
│  TOPBAR (48px)                                                  │
│  [N] Booking Insights                             [User]             │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│  SIDEBAR     │  MAIN CONTENT AREA                               │
│  (240px)     │  (fluid, max-w-7xl, centered with px-6)         │
│              │                                                  │
│  Dashboard   │                                                  │
│  Bookings    │                                                  │
│  ──────────  │                                                  │
│  Settings    │                                                  │
│              │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

### Topbar

- Height: 48px
- Background: `#ffffff`, bottom border: `#e2e6eb`
- Left: Booking Insights "N" logo mark (the bold N from the brand identity, 20px) + wordmark "Booking Insights" in `font-semibold`
- Right: user avatar or initials placeholder (import/upload is post-MVP)
- No breadcrumbs in topbar — page title lives in the main content area

### Sidebar

- Width: 240px (collapsible to 0 on tablet)
- Background: `#f4f7fa` (same as page background — visually separated by border only)
- Right border: `#e2e6eb`
- Nav items: 36px tall, 12px horizontal padding, `rounded-md`, hover: `#eef1f5`
- Active item: `#e6f2fc` background, `#006fd6` left border (3px), `#006fd6` text
- Nav structure:
  ```
  Overview
  Bookings       [badge: count of flagged]
  ─────────────
  Settings
  ```

### Main Content Area

- Padding: `px-6 py-6` on desktop
- Max width: `max-w-7xl` (consistent with most analytics dashboards at 1280px)
- Page title block: always present at top of content area
  ```
  [Page Title — text-2xl font-semibold text-neutral-900]
  [Subtitle — text-sm text-neutral-500]           [Action Button(s)]
  ─────────────────────────────────────────────── (border-b mt-4 mb-6)
  ```

---

## 5. View 1: Dashboard Overview

### Purpose

Give the user a fast health summary of the entire booking dataset. Answer "do I have problems?" in under 5 seconds.

### Layout

```
PAGE TITLE
Booking Insights
168 documents · 425 lines · Jan–Feb 2025
───────────────────────────────────────────────────────────────────

KPI ROW  (4 cards, equal width, gap-4)
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Total          │ │ Critical       │ │ Warnings       │ │ Clean          │
│ Documents      │ │ Flags          │ │                │ │                │
│               │ │               │ │               │ │               │
│       168     │ │       8       │ │      14       │ │      146      │
│               │ │               │ │               │ │               │
│ text-neutral  │ │ text-red-600  │ │ text-amber-600│ │ text-green-600│
│ ─────────     │ │ ─────────     │ │ ─────────     │ │ ─────────     │
│ 425 lines     │ │ 4.8% of docs │ │ 8.3% of docs │ │ 86.9%        │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘

> **Data grounding note:** KPI values are derived purely from the loaded
> journal entries. "Total Documents" = distinct `document_id` count.
> "Lines" = total `JournalEntryLine` count. Flag counts come from the
> flag engine. No period-over-period trends are shown because the dataset
> is a static import (Jan–Feb 2025), not a live feed.

SECOND ROW  (2-column, 60/40 split)
┌───────────────────────────────────────┐ ┌─────────────────────────┐
│ Flag Distribution by Type             │ │ Top Flagged Accounts     │
│                                       │ │                         │
│ [Bar chart — horizontal]              │ │ 1. 060000 Gehälter — 5   │
│                                       │ │ 2. 070000 Miete — 3      │
│ Duplicate entries      ████████  18   │ │ 3. 050000 Wareneins. — 3 │
│ Missing counterpart    █████     11   │ │ 4. 040000 Umsatz Inl.— 2 │
│ Unusual amount         ████       8   │ │ 5. 020000 Ford. LuL — 2  │
│ Pattern break          ██         5   │ │                          │
│ Round number anomaly   █          2   │ │ [View all accounts →]    │
│                                       │ │                         │
└───────────────────────────────────────┘ └─────────────────────────┘

THIRD ROW  (full width)
┌───────────────────────────────────────────────────────────────────┐
│ Booking Activity + Flags Over Time                                │
│                                                                   │
│ [Line chart: x=date, y=booking count, overlay: flagged count]     │
│ Two lines: total (neutral-400) and flagged (red-500)              │
│ Date range selector: [Last 7 days] [Last 30 days] [All time]      │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

FOURTH ROW  (full width)
┌───────────────────────────────────────────────────────────────────┐
│ Recent Critical Flags                              [View all →]   │
│                                                                   │
│ Table: 5 most recent critical bookings                            │
│ Columns: Date | Account | Description | Amount | Flag Type        │
│ Each row has red-tinted background, clickable → detail view       │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### KPI Card Anatomy

Each card is a `rounded-lg border bg-white p-5 shadow-sm` container.

```
┌─────────────────────────┐
│ FLAG LABEL    [icon]    │   ← text-xs font-medium text-neutral-500
│                         │     + status icon (16px), right-aligned
│ 23                      │   ← text-3xl font-bold (status color for
│                         │     critical/warning, neutral-900 for total)
│ ↑ 4 more than last week │   ← text-xs text-neutral-500
└─────────────────────────┘
```

Icons per KPI:

- Total: grid/table icon (neutral)
- Critical: exclamation-triangle (red)
- Warnings: exclamation-circle (amber)
- Clean: check-circle (green)

---

## 6. View 2: Booking List

### Purpose

Searchable, filterable table of all bookings. Users scan for patterns, filter to specific problems, and click into details.

### Layout

```
PAGE TITLE
Bookings                                           [Export CSV]
168 documents — 22 flagged
───────────────────────────────────────────────────────────────

FILTER BAR  (full-width, bg-white border rounded-lg p-4 mb-4)
┌──────────────────────────────────────────────────────────────┐
│ [Search: account, description, amount...]   [Date Range ▾]  │
│                                                              │
│ Status:  [All ●] [Critical] [Warning] [Clean]               │
│ Flag:    [All ▾]  Account: [All ▾]  Amount: [Min] — [Max]  │
│                                                    [Reset]  │
└──────────────────────────────────────────────────────────────┘

RESULTS SUMMARY  (between filters and table)
Showing 22 of 168 documents  •  Sorted by: Date (newest first) ▾

TABLE
┌────┬────────────┬──────────┬────────────────────────┬──────────────┬────────────────────────┬────────┐
│    │ Date       │ Doc Nr   │ Description             │ Account      │ Amount                 │ Status │
├────┼────────────┼──────────┼────────────────────────┼──────────────┼──────────────────────────┼────────┤
│ ●  │ 15.02.2025 │ 5000000142 │ Lieferant Müller GmbH  │ 060000       │          1,404.17 EUR  │ CRIT   │
│ ●  │ 14.02.2025 │ 5000000141 │ Lieferant Müller GmbH  │ 060000       │          1,404.17 EUR  │ CRIT   │
│ ◐  │ 10.02.2025 │ 5000000098 │ Reisekosten Februar    │ 070500       │          3,840.00 EUR  │ WARN   │
│    │ 08.02.2025 │ 5000000085 │ Büromaterial            │ 070300       │            127.50 EUR  │        │
│ ●  │ 05.02.2025 │ 5000000062 │ Stornobuchung          │ 040000       │        -50,000.00 EUR  │ CRIT   │
└────┴────────────┴──────────┴────────────────────────┴──────────────┴────────────────────────┴────────┘

[← Previous]  Page 1 of 11  [Next →]
```

### Table Specification

**Column definitions:**

| Column           | Width                | Alignment | Notes                                                     |
| ---------------- | -------------------- | --------- | --------------------------------------------------------- |
| Status indicator | 40px                 | center    | Colored dot or empty — no text to save space              |
| Date             | 110px                | left      | Format: `DD.MM.YYYY` (German locale)                      |
| Document Nr      | 100px                | left      | Monospace font for scanability                            |
| Description      | flexible (min 200px) | left      | Truncated at 1 line with tooltip on hover                 |
| Account          | 100px                | left      | Account number, monospace                                 |
| Amount           | 150px                | right     | Tabular-nums, always show 2 decimal places, currency code |
| Status badge     | 80px                 | center    | Text badge: "CRIT" / "WARN" / "OK" / empty                |

**Row states:**

```
Default (clean):  bg-white, hover: bg-neutral-50, cursor: pointer
Warning row:      bg-amber-50/60, hover: bg-amber-50, left border 3px amber-400
Critical row:     bg-red-50/80, hover: bg-red-50, left border 3px red-500
Selected row:     bg-brand-primary-tint (#e6f2fc), outline: 2px solid #006fd6
```

**Status indicator column:**

```
Critical:  ● filled circle, red-600 (#dc2626)
Warning:   ◐ half-filled circle, amber-600 (#d97706)
Clean:     — (em dash or nothing — no icon clutter for majority-clean datasets)
```

**Status badge (rightmost column):**

```
CRIT:  text-xs font-semibold uppercase
       bg-red-100 text-red-700 border border-red-200
       px-2 py-0.5 rounded

WARN:  text-xs font-semibold uppercase
       bg-amber-100 text-amber-700 border border-amber-200
       px-2 py-0.5 rounded

(clean rows have no badge — empty cell)
```

**Amount formatting:**

```
Positive:  12,500.00 EUR   (text-neutral-900)
Negative:  -50,000.00 EUR  (text-red-600, negative amounts always in red)
Zero:      0.00 EUR        (text-neutral-400, muted)
```

### Filter Bar Specification

**Search input:**

- Placeholder: "Search by description, account, or amount..."
- Width: 320px
- Searches: description text, account number (exact prefix match), document number
- Debounce: 300ms before triggering filter

**Date range picker:**

- Dropdown trigger button: shows current range or "All dates"
- Options: Today / This week / This month / Last month / Custom range
- Custom range: two date inputs (from/to), German date format `DD.MM.YYYY`

**Status filter tabs:**

- Style: pill/tab buttons, not a dropdown — always visible since this is primary filter
- States: All (default selected) / Critical / Warning / Clean
- Selected pill: `bg-neutral-900 text-white`
- Unselected pill: `bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50`

**Flag type dropdown:**

- Multi-select dropdown
- Options: Duplicate entry / Missing counterpart / Unusual amount / Pattern break / Round number anomaly
- Shows "Flag: All" when nothing selected, "Flag: 2 selected" when filtered

**Account dropdown:**

- Single-select with search inside dropdown
- Shows account number + name (if available in data)

**Amount range:**

- Two numeric inputs: Min — Max
- EUR suffix, no currency symbol inside input
- Validation: Min must be <= Max

**Reset:**

- Text button, only appears when any filter is active
- "Reset filters" clears everything back to defaults

### Pagination

- 50 rows per page (default; enough to scan but not overwhelm)
- Simple prev/next with page indicator
- "Jump to page" input for power users when > 5 pages
- Row count confirmation: "Showing 1–50 of 110 results"

---

## 7. View 3: Booking Detail

### Purpose

Full context for a single booking. Show why it was flagged, what's related, and enough accounting context to act.

### Layout

```
← Back to Bookings                                                  [Export]

5000000142 — Lieferant Müller GmbH                     ● CRITICAL
15.02.2025

──────────────────────────────────────────────────────────────────────────────

TWO-COLUMN LAYOUT (60/40)

LEFT COLUMN:
┌──────────────────────────────────────────────────────┐
│ Booking Data                                         │
├────────────────────┬─────────────────────────────────┤
│ Document ID        │ 5000000142                       │
│ Line               │ 1                                │
│ Posting Date       │ 15.02.2025                       │
│ Document Type      │ KR — Kreditorenrechnung          │
│ GL Account         │ 060000 — Gehälter                │
│ Amount             │ 1,404.17 EUR (Soll)              │
│ Tax Code           │ V19                              │
│ Cost Center        │ 3000 — Production                │
│ Vendor             │ V0007                            │
│ Booking Text       │ Lieferant Müller GmbH            │
│ Company Code       │ 1000                             │
└────────────────────┴─────────────────────────────────┘

> **Data grounding:** All fields come directly from `JournalEntryLine`.
> The "Contra Account" is derived by looking at other lines in the same
> `document_id`. There is no `user` or `import_batch` field in the data.

┌──────────────────────────────────────────────────────┐
│ Why was this flagged?                                │
│                                                      │
│ ● DUPLICATE ENTRY                                    │
│   This booking appears to be a duplicate of          │
│   5000000141 (same account, similar amount within    │
│   5%, posted within 2 days).                         │
│   Duplicates often result from double imports or     │
│   manual re-entry of already-posted documents.       │
│                                                      │
│   Confidence: High                                   │
│                                                      │
│ [Mark as False Positive]  [Confirm as Duplicate]     │
└──────────────────────────────────────────────────────┘

RIGHT COLUMN:
┌────────────────────────────────────┐
│ Related Bookings                   │
│                                    │
│ POSSIBLE DUPLICATE                 │
│ 5000000141 — Lieferant Müller GmbH │
│ 14.02.2025 · 1,404.17 EUR · CRIT   │
│ [View →]                           │
│                                    │
│ SAME ACCOUNT (all documents)       │
│ 5000000098  10.02.2025   2,100.00  │
│ 5000000062  05.02.2025   3,750.00  │
│ 5000000031  20.01.2025   1,404.17  │
│ [Show all on 060000 →]             │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Account Summary                    │
│ 060000 — Gehälter                  │
│                                    │
│ Total documents:  12               │
│ Flagged:          3 (25.0%)        │
│ Avg. amount:      1,280 EUR        │
│ This booking:     1,404 EUR        │
│ vs. avg:          +9.7% above avg  │
│                                    │
│ [View account history →]           │
└────────────────────────────────────┘

──────────────────────────────────────────────────────────────────────────────

FULL WIDTH BELOW:
┌──────────────────────────────────────────────────────────────────────────┐
│ Document Lines                                                            │
│                                                                          │
│ All lines belonging to document 5000000142:                              │
│                                                                          │
│ Line 1  060000 Gehälter        S   1,404.17 EUR  KSt 3000               │
│ Line 2  030000 Verb. LuL       H   1,179.14 EUR                         │
│ Line 3  020200 Vorsteuer        S     225.03 EUR                         │
│                                                                          │
│ Balance: 0.00 EUR ✓                                                      │
└──────────────────────────────────────────────────────────────────────────┘

> **Design note:** Instead of an activity log (which would require a
> persistence layer), the detail view shows all journal entry lines for
> the same document. This is more useful for accountants — it shows the
> full double-entry context and lets them verify the document balances.
```

### Detail Page — Interaction Specification

**Back navigation:**

- "← Back to Bookings" link at top left
- Preserves the filter and scroll position the user came from (use URL state for filters)
- Keyboard: `Escape` or browser back

**Status header:**

- Booking identifier (document number) is the `h1`
- Description as subtitle
- Date as secondary line
- Status badge large variant (not the compact table badge)

**Flag explanation card:**

- This is the highest-priority content on the page — it should be visually prominent
- Border-left: 4px solid red (critical) or amber (warning)
- Background: status-critical-bg or status-warning-bg
- Human-readable plain language explanation — not a code or category name
- Shows: flag type, explanation text, confidence level, detection date
- Actions: "Mark as False Positive" (secondary button) and "Confirm as [Flag Type]" (primary button with status color)

**Related bookings panel:**

- Shows at most 3 related bookings inline; "Show all N →" link for more
- Each related booking is a compact card: doc number, description, date, amount, status badge
- The specific duplicate link (if applicable) is always shown first, labeled "POSSIBLE DUPLICATE"

**Account summary:**

- Provides statistical context — is this amount unusual for this account?
- "vs. avg" line uses color: green if within 20%, amber if 20–50% above, red if >50% above
- This helps users judge severity without running their own calculation

**Document lines panel:**

- Shows all `JournalEntryLine` rows sharing the same `document_id`
- Columns: Line ID, GL Account (number + name), Debit/Credit indicator, Amount, Cost Center (if present)
- Footer row: sum of debits vs. credits, with a balance check (should always be 0.00)
- This replaces an activity log — accountants need the full double-entry context, not an event timeline
- MVP has no persistence for user actions (mark as reviewed, add notes). These require a database and are post-MVP.

---

## 8. Component Inventory

### A. KPI Card

**Variants:** Default / Critical / Warning / Clean  
**States:** Loading (skeleton) / Populated / Empty (no data)  
**Props needed:** `label`, `value`, `trend`, `trendLabel`, `variant`

### B. Status Badge

**Variants:** Critical / Warning / Clean / Info  
**Sizes:** Default (table use) / Large (detail page header)  
**States:** Default / Hover (if interactive)

### C. Flag Explanation Card

**Variants:** Critical / Warning  
**States:** Default / Actions confirmed / Dismissed as false positive  
**Contains:** Flag type heading, explanation text, confidence, date, action buttons

### D. Data Table

**Features:** Sortable columns (click header), row hover, row click → navigate to detail, sticky header on scroll  
**States:** Loading / Populated / Empty (filtered) / Error  
**Row variants:** Clean / Warning / Critical / Selected

### E. Filter Bar

**Components within:** SearchInput / DateRangePicker / StatusPillGroup / FlagTypeDropdown / AccountDropdown / AmountRange / ResetButton  
**States:** Collapsed (mobile) / Expanded (desktop)

### F. Horizontal Bar Chart (Flag Distribution)

**Library suggestion:** Recharts (already likely available or easy to add)  
**Spec:** Horizontal bars, label left, count right, color matches flag severity if applicable  
**States:** Loading / Populated / Empty

### G. Time Series Chart (Activity Over Time)

**Library suggestion:** Recharts  
**Spec:** Two lines (total bookings + flagged count), x-axis dates, y-axis counts, hover tooltip showing values for that date  
**States:** Loading / Populated / Single data point (no line, just dot) / No data

### H. Related Booking Card (compact)

**Spec:** Compact card showing doc number, description, date, amount, status badge  
**States:** Default / Hover / Current (self-referential, shown as non-clickable)

### I. Account Summary Card

**Spec:** Key-value pairs with one "vs. average" highlighted row  
**States:** Loading / Populated / No history (new account)

### J. Document Lines Table

**Spec:** All journal entry lines for a given document, showing account, debit/credit, amount, cost center. Footer with balance check.  
**States:** Loading / Populated  
**Not interactive** — read-only display of the double-entry context

### K. Pagination

**Spec:** Prev / Page indicator / Next; page jump input for large result sets  
**States:** First page (prev disabled) / Last page (next disabled) / Single page (hidden entirely)

### L. Empty State

**Used in:** Filtered table (no results) / Fresh import (no data yet) / All-clean dataset (no flags)  
**Spec:** Centered illustration area + heading + subtext + optional CTA button  
**Variants:**

- No data: "No bookings loaded" + message to check data generation script
- No results: "No bookings match your filters" + "Reset filters" link
- All clean: "No flags found" + a positive confirmation message (this is a success state)

---

## 9. User Flows

### Flow A: First load

```
Dashboard (data loaded from pre-generated journal-entries.json)
  → Flag engine runs on all entries
  → KPI cards show totals + flag counts
  → User sees overview immediately
```

> **MVP note:** There is no import flow yet. The app loads the
> pre-generated `journal-entries.json` at startup. A file upload /
> import feature is post-MVP.

### Flow B: Triage critical issues

```
Dashboard
  → See critical count KPI (23 critical)
  → [View all →] link in "Recent Critical Flags" table
  → Booking List (filtered to Critical)
  → Click on highest-priority row
  → Booking Detail
  → Read flag explanation
  → Decide: [Mark as False Positive] or [Confirm as Duplicate]
  → ← Back to Bookings (filter preserved)
  → Next critical booking
```

### Flow C: Investigate a specific account

```
Dashboard → "Top Flagged Accounts" → click account number
  OR
Booking List → Account dropdown → select account
  → List filtered to that account
  → Scan for pattern
  → Click suspicious booking → Detail view
  → Account Summary panel shows statistical context
```

### Flow D: Search for specific booking

```
Booking List
  → Search input: type document ID (e.g. "5000000142") or text (e.g. "Müller")
  → Results filter instantly (300ms debounce)
  → Click result → Detail view
```

### Flow E: Date range investigation

```
Booking List
  → Date Range picker → "Last month" (or custom: 01.03.–31.03.2026)
  → Table shows only bookings in range
  → Also apply Status: Critical
  → Export filtered results as CSV
```

### Navigation Pattern

- The sidebar "Bookings" item always links to the **unfiltered** Booking List
- Active filters are reflected in the URL as query params: `/bookings?status=critical&account=060000`
- Sharing a URL gives the exact filtered view (useful for async collaboration: "look at this filter result")
- The Detail page URL: `/bookings/5000000142` — direct link to a booking (uses `document_id`)

---

## 10. Data Display Patterns

### Amount Display

```
Rule: Always show 2 decimal places. Always show currency code. Align right.
Tabular numbers (font-variant-numeric: tabular-nums) in all amount columns.

Positive:          12,500.00 EUR   — text-neutral-900
Negative:         -50,000.00 EUR   — text-red-600
Zero:               0.00 EUR       — text-neutral-400 (muted)
Large (>100k):    150,000.00 EUR   — no special treatment, just format correctly
```

### Date Display

```
Table / compact view:  31.03.2026  (German locale DD.MM.YYYY)
Detail / verbose:      31. März 2026
Relative (activity):   vor 2 Stunden / vor 3 Tagen (when < 7 days ago)
Timestamps:            31.03.2026, 09:41 Uhr
```

### Account Numbers

```
Display: always show 6-digit account number + name from account master
Format: "060000 — Gehälter"
If name not in GL_ACCOUNTS: "071100" alone (number only)
Monospace font for the number portion
```

### Flag Type Labels

```
Technical ID → Human-readable display:

duplicate_entry      → "Duplicate Entry"
missing_counterpart  → "Missing Counterpart"
unusual_amount       → "Unusual Amount"
pattern_break        → "Pattern Break"
round_number_anomaly → "Round Number Anomaly"
```

### Anomaly Scores / Confidence

```
Show as text label, not a percentage:
  > 0.8:   "High confidence"    — shown in red/amber depending on flag type
  0.5–0.8: "Medium confidence"
  < 0.5:   "Low confidence"     — consider showing "(Investigate further)"

Do not show raw decimal scores to end users — accountants need judgment calls,
not probability theory.
```

### Empty / Null Values

```
Missing text field:  — (em dash, text-neutral-300)
Missing amount:      — (em dash)
Missing account:     "(No account)" in italic text-neutral-400
Never show "null", "undefined", or empty string — always substitute with em dash
```

---

## 11. State Specifications

### Loading States

Every data-fetching component needs a loading skeleton. Skeletons match the shape of the content they replace.

```
KPI cards:    4 cards with animated pulse, same dimensions, gray rectangles
              for value (48px x 60%) and trend (16px x 40%)
Table:        7 skeleton rows, each cell is a gray rectangle
              Row heights: 52px (same as real rows)
Chart:        Gray rectangle placeholder, no animation needed (charts take
              longer and users accept that)
Detail page:  Left column table skeleton + right column two card skeletons
```

Use `animate-pulse bg-neutral-100 rounded` for all skeleton elements.

### Empty States

**No data imported yet (fresh app):**

```
[Centered in main content area]
[Import icon — 48px, text-neutral-300]
No bookings imported
Import your booking data to get started.
[Regenerate Data]  ← link to docs/instructions for running the generation script
```

**No results matching filters:**

```
[Search/filter icon — 48px, text-neutral-300]
No bookings match your filters
Try adjusting your search or filters.
[Reset filters]  ← text link, no button styling
```

**All bookings are clean (great outcome):**

```
[Checkmark icon — 48px, text-green-500]
No flags found
All 168 documents look clean.
[← Back to Dashboard]
```

### Error States

**Import failed:**

```
[Alert icon — amber]
Import failed
We could not process this file. Make sure it is a valid CSV or DATEV export.
[Try again]  [Contact support]
```

**Data load error (API/network):**

```
[Subtle inline error, not full page]
Could not load bookings. [Retry]
```

**Invalid filter combination:**

- Inline validation message below the filter input that caused the conflict
- Never block the UI entirely for a filter error

### Action Confirmation States

> **MVP scope:** The action buttons ("Mark as False Positive", "Confirm as Duplicate")
> are **not implemented in MVP**. They require a persistence layer (database) to store
> user decisions. The buttons are shown in the design for illustration of the target UX.
> For MVP, the detail view is read-only — users analyze flags but record decisions
> outside the app (e.g., in their ERP system).

---

## 12. Responsive Behavior

### Target Breakpoints

The app is desktop-first. Accountants and finance analysts primarily work on desktop or laptop screens. Tablet is a secondary concern. Mobile is out of scope for MVP.

```
Desktop:  1280px+ (max-w-7xl content, sidebar visible)
Laptop:   1024px–1279px (sidebar visible, table columns may compress)
Tablet:   768px–1023px (sidebar collapses to icon-only or hamburger)
Mobile:   < 768px (out of scope for MVP — show a "please use desktop" message)
```

### Desktop (1280px+)

- Full sidebar (240px) + content
- 4-column KPI row
- 60/40 two-column layout on dashboard second row
- Full table with all columns visible

### Laptop (1024px–1279px)

- Full sidebar still visible
- KPI row: 4 columns, cards slightly narrower — works fine
- Table: Description column compresses first; Amount and Status stay fixed-width
- Dashboard second row: 55/45 split

### Tablet (768px–1023px)

- Sidebar collapses: icon-only (40px wide) with tooltip labels on hover
- KPI row: 2x2 grid instead of 4 columns
- Dashboard: second row stacks vertically (full width each)
- Table: hide "Document Nr" column; show it in a collapsed row detail on tap
- Filter bar: date range and advanced filters move behind a "Filters" button that opens a drawer from the right

### Mobile (< 768px)

Show a full-page message:

```
[Booking Insights logo]
Booking Insights works best on a larger screen.
For the best experience analyzing your booking data,
please open this app on a desktop or laptop.
[Continue anyway]  ← small link to bypass for edge cases
```

The "Continue anyway" path is not designed — it should show a minimal, non-broken version of the dashboard only.

---

## Appendix A: Quick Reference — Color Tokens

| Token                  | Hex       | Usage                                 |
| ---------------------- | --------- | ------------------------------------- |
| Brand Primary          | `#006fd6` | Links, active states, primary buttons |
| Brand Primary Dim      | `#005ab0` | Button hover                          |
| Brand Primary Tint     | `#e6f2fc` | Selected row, info backgrounds        |
| Neutral 0              | `#ffffff` | Card surfaces                         |
| Neutral 50             | `#f4f7fa` | Page background                       |
| Neutral 100            | `#eef1f5` | Row hover                             |
| Neutral 200            | `#e2e6eb` | Borders                               |
| Neutral 500            | `#737880` | Muted text, labels                    |
| Neutral 900            | `#1a1a1a` | Primary text                          |
| Status Critical        | `#dc2626` | Red-600                               |
| Status Critical Bg     | `#fef2f2` | Red-50                                |
| Status Critical Border | `#fecaca` | Red-200                               |
| Status Warning         | `#d97706` | Amber-600                             |
| Status Warning Bg      | `#fffbeb` | Amber-50                              |
| Status Warning Border  | `#fde68a` | Amber-200                             |
| Status Clean           | `#16a34a` | Green-600                             |
| Status Clean Bg        | `#f0fdf4` | Green-50                              |
| Status Clean Border    | `#bbf7d0` | Green-200                             |
| Status Info            | `#2563eb` | Blue-600                              |
| Status Info Bg         | `#eff6ff` | Blue-50                               |
| Status Info Border     | `#bfdbfe` | Blue-200                              |

## Appendix B: Route Map

```
/                        → Redirect to /dashboard
/dashboard               → View 1: Dashboard Overview
/bookings                → View 2: Booking List (unfiltered)
/bookings?status=critical → View 2: pre-filtered
/bookings?account=060000 → View 2: pre-filtered by account
/bookings/[documentId]   → View 3: Booking Detail (e.g. /bookings/5000000142)
/settings                → Settings (out of scope for MVP)
```

## Appendix C: Tailwind Implementation Notes

Since this project uses Tailwind CSS 4, define the color tokens as CSS custom properties in `globals.css` and reference them via Tailwind's `@theme` block. This keeps design tokens in one place.

Example structure:

```css
/* globals.css */
@theme inline {
  --color-brand: #006fd6;
  --color-brand-dim: #005ab0;
  --color-brand-tint: #e6f2fc;

  --color-surface: #ffffff;
  --color-background: #f4f7fa;

  --color-critical: #dc2626;
  --color-critical-bg: #fef2f2;
  --color-critical-border: #fecaca;

  --color-warning: #d97706;
  --color-warning-bg: #fffbeb;
  --color-warning-border: #fde68a;

  --color-clean: #16a34a;
  --color-clean-bg: #f0fdf4;
  --color-clean-border: #bbf7d0;
}
```

This allows utility classes like `bg-critical-bg`, `text-critical`, `border-warning-border` throughout the application.

The `tabular-nums` Tailwind utility applies `font-variant-numeric: tabular-nums` — use it on all amount columns for consistent number alignment.
