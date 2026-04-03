# Booking Manual — UX Design Document

**Product:** Booking Insights  
**Feature:** Booking Manual (Buchungsregeln)  
**Version:** MVP  
**Date:** 2026-04-02  
**Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Design Decisions](#2-design-decisions)
3. [Information Architecture](#3-information-architecture)
4. [Page Layout & Wireframes](#4-page-layout--wireframes)
5. [Component Specifications](#5-component-specifications)
6. [Interaction Specifications](#6-interaction-specifications)
7. [Copy & Microcopy](#7-copy--microcopy)
8. [Edge Cases & States](#8-edge-cases--states)
9. [Relationship to the Existing Flag System](#9-relationship-to-the-existing-flag-system)
10. [Component Inventory](#10-component-inventory)

---

## 1. Problem Statement

The existing flag system tells accountants _what_ is wrong with individual bookings. The Booking Manual tells them _how bookings should work_ — the underlying rules derived from the data itself.

Without a Booking Manual, an accountant who sees a "pattern break" flag has to mentally reconstruct what the pattern was. With it, the rule is explicit: "Account 070000 is always posted with tax code V19 — 94% of the time."

The Booking Manual also inverts the workflow: instead of starting with a flagged booking and asking "why is this wrong?", a user can start with a rule and ask "which bookings violate it?"

**Target user:** Finance analyst or accountant reviewing booking data. They know their chart of accounts. They think in terms of rules and exceptions, not individual transactions.

**Primary goal for MVP:** Surface the 5–10 most consistent patterns derived from the booking data, with their strength and any violations. Keep it read-only — no editing, no rule management.

---

## 2. Design Decisions

### 2.1 Where does the Booking Manual live?

**Decision: New sidebar entry at `/manual`, at the same level as Bookings.**

Rationale:

- The Booking Manual is a peer concept to the Booking List — same data, different lens. It is not a sub-section of Bookings, and it is not part of the Dashboard (which is about aggregates and health scores).
- A new page gives it breathing room for future expansion (rule management, export) without cramping existing pages.
- The sidebar currently has two items (Overview, Bookings). Adding "Manual" as a third is well within the navigation budget.

Rejected alternatives:

- **Tab within Bookings page:** Would bury the feature and imply the Manual is a view of the bookings list rather than a distinct analytical lens.
- **Section on Dashboard:** The Dashboard is about health metrics. The Manual is about rules. Conceptually different.
- **Modal or slide-over from a bookings row:** The Manual applies to all bookings, not a single one. A global page is the right scope.

### 2.2 How are rules presented?

**Decision: Card list with inline confidence bar. Not a table.**

Rationale:

- Each rule has qualitatively different structure (some involve accounts, some cost centers, some document types). A table would need generic columns that don't fit all rules cleanly.
- Cards give each rule its own reading space — the description is prose, which tables handle poorly.
- The list remains compact: rules are short, so cards don't feel bloated.
- Expandable sections (accordion) are not needed at MVP because there are only 5–10 rules. Adding expand/collapse for 7 rules would create unnecessary friction.

### 2.3 How is evidence shown?

**Decision: Inline, limited to 2–3 example document IDs linking to booking detail.**

Rationale:

- More than 3 examples create visual noise without adding decision-making value. The accountant can click "View all matching bookings" to see the full set.
- Showing examples inline (rather than in a modal or drawer) keeps the context visible while reading the rule.
- Linking to booking detail pages is the right navigation target — the accountant can verify the evidence in full context.

### 2.4 How do violations connect to the bookings list?

**Decision: "View violations in Bookings" link that pre-applies a filter.**

Rationale:

- The Booking List already has a URL-based filter system. A rule violation link should be a pre-filtered Bookings URL, not a separate page.
- This is low implementation cost and reuses an established pattern.
- For MVP, a deep link is sufficient. A future version could add a dedicated "violations" view with per-rule context.

### 2.5 How does this relate to the existing flag system?

**Decision: Violation count on a rule card is linked to the bookings list filtered by the `pattern_break` flag type AND the relevant account/dimension. Rules do NOT add new flags to the table — the existing flag system already captures violations as `pattern_break`.**

Rationale:

- The Booking Manual makes existing flags explainable. It does not replace or duplicate them.
- Adding a new "manual_violation" flag type would create a second source of truth and confuse the status system.
- The connection between a rule and its violations is via the existing `pattern_break` flag, surfaced through filtered navigation.

---

## 3. Information Architecture

### Sidebar Navigation (updated)

```
Overview          /dashboard
Bookings          /bookings
Manual            /manual         ← new
```

### URL Structure

```
/manual                    List of all rules (the Booking Manual page)
```

No sub-routes needed for MVP. Rules are not individually addressable — they are shown as a list on one page.

### Data Model (for developer reference)

Each rule the UI must represent:

```
Rule {
  id:            string            // internal identifier
  description:   string            // human-readable: "Account 070000 always posted with V19"
  category:      RuleCategory      // "account_tax" | "cost_center" | "recurring" | "document_type"
  confidence:    number            // 0–100 — how consistently the pattern holds
  evidenceCount: number            // total bookings supporting this rule
  exampleIds:    string[]          // 2–3 document IDs shown inline
  violationCount: number           // bookings that break the rule
  violationFilterUrl: string       // pre-built /bookings URL for violations
  evidenceFilterUrl:  string       // pre-built /bookings URL for all matching bookings
}
```

---

## 4. Page Layout & Wireframes

### 4.1 Full Page — Normal State (5 rules shown)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Topbar]                                                                    │
├─────────────┬───────────────────────────────────────────────────────────────┤
│             │                                                               │
│  Overview   │  Booking Manual                                               │
│  Bookings   │  5 rules derived from 1,240 bookings                         │
│  Manual  ●  │  ─────────────────────────────────────────────────────────── │
│             │                                                               │
│             │  ┌──────────────────────────────────────────────────────────┐│
│             │  │  Account + Tax Code Rule                           94 %  ││
│             │  │  ────────────────────────────────────────────────────── ││
│             │  │  Account 070000 is always posted with tax code V19.      ││
│             │  │                                                           ││
│             │  │  ████████████████████████░░  94% confidence              ││
│             │  │                                                           ││
│             │  │  Examples: KR-2024-0041  KR-2024-0089  KR-2024-0102     ││
│             │  │                                                           ││
│             │  │  3 violations  ·  View violations →                      ││
│             │  └──────────────────────────────────────────────────────────┘│
│             │                                                               │
│             │  ┌──────────────────────────────────────────────────────────┐│
│             │  │  Cost Center Assignment Rule                       100 % ││
│             │  │  ────────────────────────────────────────────────────── ││
│             │  │  Personnel expenses (accounts 060000–069999) always      ││
│             │  │  go to cost center 1000.                                 ││
│             │  │                                                           ││
│             │  │  ██████████████████████████  100% confidence             ││
│             │  │                                                           ││
│             │  │  Examples: KR-2024-0012  KR-2024-0033                   ││
│             │  │                                                           ││
│             │  │  No violations found                                     ││
│             │  └──────────────────────────────────────────────────────────┘│
│             │                                                               │
│             │  ┌──────────────────────────────────────────────────────────┐│
│             │  │  Recurring Posting Rule                            88 %  ││
│             │  │  ────────────────────────────────────────────────────── ││
│             │  │  "Miete" is posted monthly to account 070000, typically  ││
│             │  │  between the 1st and 5th of the month.                   ││
│             │  │                                                           ││
│             │  │  ████████████████████████░░░  88% confidence             ││
│             │  │                                                           ││
│             │  │  Examples: KR-2024-0001  KR-2024-0071  KR-2024-0141     ││
│             │  │                                                           ││
│             │  │  1 violation  ·  View violation →                        ││
│             │  └──────────────────────────────────────────────────────────┘│
│             │                                                               │
│             │  [ + 2 more rules ]                                           │
│             │                                                               │
└─────────────┴───────────────────────────────────────────────────────────────┘
```

Notes on the layout:

- `PageHeader` is reused exactly as-is. Title: "Booking Manual". Subtitle: "N rules derived from N bookings".
- The rule list uses the same `max-w-7xl` container and `px-6 py-6` padding as all other pages.
- No filter bar — at MVP with 5–10 rules, filtering adds complexity without clear benefit.
- "N more rules" is a simple disclosure toggle (client component), not pagination. Only needed if rules exceed 5.

### 4.2 Rule Card — Anatomy

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Category label]                                     [Confidence %] │  ← header row
│  ──────────────────────────────────────────────────────────────────  │  ← divider
│  [Rule description — 1–2 sentences, plain language]                  │  ← body
│                                                                      │
│  [Confidence bar]  [Confidence % label]                              │  ← visual signal
│                                                                      │
│  Examples: [DocId link]  [DocId link]  [DocId link]                  │  ← evidence
│                                                                      │
│  [Violation count]  ·  [View violations link]          OR            │  ← footer (violations)
│  No violations found                                                 │  ← footer (clean)
└──────────────────────────────────────────────────────────────────────┘
```

### 4.3 Rule Card — Detail: 3 violation states

**State A: No violations**

```
┌───────────────────────────────────────────────────────────────────┐
│  Cost Center Assignment Rule                               100 %  │
│  ─────────────────────────────────────────────────────────────── │
│  Personnel expenses (accounts 060000–069999) always go to cost   │
│  center 1000.                                                     │
│                                                                   │
│  ██████████████████████████  100%                                 │
│                                                                   │
│  Examples: KR-2024-0012  KR-2024-0033  KR-2024-0067             │
│                                                                   │
│  No violations found                                              │
└───────────────────────────────────────────────────────────────────┘
```

- "No violations found" in `text-neutral-500`. No link. No color. Fades into background.

**State B: Violations present**

```
┌───────────────────────────────────────────────────────────────────┐
│  Account + Tax Code Rule                                   94 %   │
│  ─────────────────────────────────────────────────────────────── │
│  Account 070000 is always posted with tax code V19.               │
│                                                                   │
│  ████████████████████████░░  94%                                  │
│                                                                   │
│  Examples: KR-2024-0041  KR-2024-0089  KR-2024-0102             │
│                                                                   │
│  3 violations  ·  View violations →                               │
└───────────────────────────────────────────────────────────────────┘
```

- Violation count in `text-warning` (amber). "View violations →" is a `text-brand` link.
- Single violation: "1 violation" (no plural).

**State C: High violation count (rule is weak)**

```
┌───────────────────────────────────────────────────────────────────┐
│  Document Type Rule                                        71 %   │
│  ─────────────────────────────────────────────────────────────── │
│  Vendor invoices (KR) typically use accounts 050000–079999.       │
│                                                                   │
│  ████████████████████░░░░░░  71%                                  │
│                                                                   │
│  Examples: KR-2024-0003  KR-2024-0019                            │
│                                                                   │
│  18 violations  ·  View violations →                              │
└───────────────────────────────────────────────────────────────────┘
```

- At < 80% confidence, the confidence % in the header uses `text-neutral-500` (not the default `text-neutral-900`). The bar itself appears shorter. No red coloring — this is a weak rule, not an error.
- Violation count in `text-warning` as before.

### 4.4 Confidence Bar — Visual Design

The bar is a simple horizontal progress element, full-width of the card.

```
Confidence:  ████████████████████░░░░  88%
             [filled]              [empty]
```

- Full bar width: width of card content area
- Filled portion: `bg-brand-primary` (#006fd6)
- Empty portion: `bg-neutral-100`
- Height: 6px (thin, not chunky — this is data annotation, not a primary UI element)
- "88%" label in `text-xs font-medium text-neutral-500` immediately to the right, or rendered inline as above

Color thresholds for the filled bar:

- 90–100%: `bg-clean` (green) — solid, reliable rule
- 70–89%: `bg-brand-primary` (blue) — meaningful pattern
- < 70%: `bg-warning` (amber) — weak signal, treat as indicative only

This color coding is additive to the percentage label — the bar color alone carries the signal.

### 4.5 Sidebar — Updated

```
┌────────────────────────┐
│  [Logo / Topbar]       │
├────────────────────────┤
│                        │
│  Overview              │
│  Bookings              │
│  Manual            ←  │
│                        │
└────────────────────────┘
```

The sidebar nav item "Manual" follows the exact same `SidebarNavItem` component as "Overview" and "Bookings". No icon needed to match existing style. Active state is handled by the existing `SidebarNavItem` component.

---

## 5. Component Specifications

### 5.1 ManualRuleCard

**Type:** Server component (no interactivity beyond links)

**Props:**

```
ManualRuleCardProps {
  category:           string           // display label: "Account + Tax Code Rule"
  description:        string           // "Account 070000 is always posted with tax code V19."
  confidence:         number           // 0–100
  exampleIds:         string[]         // max 3, linked to /bookings/[id]
  violationCount:     number
  violationFilterUrl: string | null    // null if violationCount is 0
  evidenceFilterUrl:  string           // always present
}
```

**Layout structure:**

```
<div> — card wrapper: rounded-lg border border-neutral-200 bg-white p-5 shadow-sm
  <div> — header row: flex items-center justify-between mb-3
    <span> — category: text-xs font-semibold uppercase tracking-wide text-neutral-500
    <span> — confidence %: text-sm font-semibold tabular-nums [color by threshold]
  <hr> — border-neutral-100
  <p> — description: text-sm text-neutral-700 mt-3
  <div> — confidence bar: mt-3
    <div> — track: w-full h-1.5 rounded-full bg-neutral-100
      <div> — fill: h-full rounded-full [color] [width as style]
  <div> — examples: mt-3 flex flex-wrap gap-x-3 gap-y-1 items-center
    <span> — "Examples:" text-xs text-neutral-500
    <a ...> — each example: font-mono text-xs text-brand hover:underline
  <div> — footer: mt-3 flex items-center gap-2 text-xs
    [violation state]
```

**Confidence color logic (for the header % label and bar fill):**

- > = 90: `text-clean` / `bg-clean`
- 70–89: `text-neutral-900` / `bg-brand` (#006fd6)
- < 70: `text-neutral-500` / `bg-warning`

### 5.2 ManualPage (page.tsx)

**Type:** Server component

**Structure:**

```
<PageHeader title="Booking Manual" subtitle="N rules derived from N bookings" />
<div className="space-y-4">
  {rules.map(rule => <ManualRuleCard key={rule.id} {...rule} />)}
</div>
```

No client components needed for MVP. If a "show more" disclosure is added later, that becomes a thin client wrapper.

### 5.3 Updated Sidebar

The `Sidebar` component gains one additional `SidebarNavItem`:

```
<SidebarNavItem href="/manual" label="Manual" />
```

Placed after "Bookings", before any future additions.

---

## 6. Interaction Specifications

### Clicking an example document ID

- Target: `/bookings/[documentId]`
- Opens the full Booking Detail page for that document
- No state is lost on the Manual page (it is a static server page)
- Back button in the browser or the "← Back to Bookings" link in the detail page returns the user

### Clicking "View violations →"

- Target: `violationFilterUrl` — a pre-built `/bookings?flag=pattern_break&account=070000` style URL (exact filter params depend on the rule category)
- Opens the Bookings list pre-filtered to the violating bookings
- The user sees the standard BookingTable with the filter bar showing the active filters
- No special UI on the Bookings page to indicate "you arrived from the Manual" — the filter state is self-explanatory for MVP

### Clicking "View all matching bookings" (optional, future)

- The `evidenceFilterUrl` can be surfaced as a secondary link if desired
- For MVP, omit this — the example IDs are sufficient evidence

### No expand/collapse interaction

- All rules are visible at once
- If the rule list exceeds 8 items, a simple "Show N more" button (client component) reveals the rest
- The threshold (8) is chosen so the page is not overwhelming — 7 rules visible immediately, no truncation in the common case

---

## 7. Copy & Microcopy

### Page

| Element                 | Copy                             |
| ----------------------- | -------------------------------- |
| Page title              | Booking Manual                   |
| Page subtitle           | N rules derived from N bookings  |
| Page subtitle (0 rules) | No rules have been generated yet |

### Rule Card

| Element                               | Copy                             |
| ------------------------------------- | -------------------------------- |
| Category — account + tax code         | Account + Tax Code Rule          |
| Category — cost center                | Cost Center Assignment Rule      |
| Category — recurring                  | Recurring Posting Rule           |
| Category — document type              | Document Type Rule               |
| Examples label                        | Examples:                        |
| No violations                         | No violations found              |
| 1 violation                           | 1 violation · View violation →   |
| N violations                          | N violations · View violations → |
| Confidence label (appended after bar) | [N]% confidence                  |

### Tone notes

- Rule descriptions are written in plain language, not SQL. "Account 070000 is always posted with tax code V19" — not "WHERE account = '070000' AND tax_code = 'V19'".
- "Violation" not "anomaly" or "exception" in this context — the word "violation" is cleaner and more actionable for rule-based logic.
- "View violations →" uses an arrow to signal navigation, consistent with existing link patterns in the codebase ("← Back to Bookings").

---

## 8. Edge Cases & States

### Empty state: No rules generated yet

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│              [search icon]                                     │
│                                                                │
│          No rules found                                        │
│          Rules are generated by analyzing your booking        │
│          data. Upload more bookings to get started.           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

Uses the existing `EmptyState` component:

- heading: "No rules found"
- subtext: "Rules are generated automatically by analyzing your booking data."
- No action button (nothing to do at this stage)

### Low-confidence rules (< 60%)

**Decision: Do not show rules below 60% confidence in the MVP.**

Rationale: Below 60%, a rule is more noise than signal. If the data shows a pattern that holds 58% of the time, it is not a rule — it is a coincidence. Filter these out at the data layer before rendering. The page should only show rules the user can trust.

If this threshold needs to be user-configurable, that is a post-MVP feature.

### Many violations (violationCount > total \* 0.5)

If more than half the supporting bookings are violations, the rule is effectively broken. In this case:

- Show the rule but add a note: "This rule may no longer reflect current practice."
- Show violation count in `text-warning` as normal
- Do not show the rule in `text-critical` — it is not a data error, it is a weak or outdated pattern

### Single example

If `exampleIds` has only 1 entry, still render the Examples label with a single link. Do not hide the section.

### Very long rule description

Cap description at 3 lines with CSS line-clamp. If the description is naturally longer, it indicates a data quality issue on the generation side. For MVP, line-clamp-3 is sufficient protection.

### Loading state

The page is a server component. Loading is handled by the Next.js loading.tsx convention:

- A `loading.tsx` at `/manual/loading.tsx` shows skeleton versions of 3–4 rule cards
- Each skeleton card matches the height of a typical rule card (~160px)
- Use the same `animate-pulse` pattern as other loading states in the app if one exists; otherwise `bg-neutral-100` placeholder divs

---

## 9. Relationship to the Existing Flag System

### How the Manual and Flags are connected

```
Rule: "Account 070000 always posted with tax code V19"   [Booking Manual]
  ↓ when a booking violates this
Flag: pattern_break on that booking                       [Flag system]
  ↓ visible in
Booking list: amber/red row + StatusBadge                 [Bookings page]
  ↓ explained in
FlagExplanationCard: "Pattern break — ..."               [Booking Detail]
```

The Booking Manual is the top of this chain — it provides the explicit rule that contextualizes every `pattern_break` flag downstream.

### What this means for the Bookings page

For MVP: no changes to the Bookings page or Booking Detail needed.

**Future opportunity (post-MVP):** In the FlagExplanationCard for `pattern_break` flags, add a "See rule in Manual →" link. This closes the loop — a user investigating a flagged booking can jump to the rule that was broken, understand its confidence and history, and make a more informed judgment.

This link is not part of the MVP because:

1. The rule-to-flag mapping must be stored and passed through the data model
2. It adds complexity to a FlagExplanationCard that should stay focused on the specific booking

### What is NOT done (by design)

- The Manual does not add new flag types or new colored rows to the Bookings table
- The Manual does not override or duplicate existing flags
- The Manual is not a "rule editor" — rules are generated, not authored by the user
- Violations in the Manual are not separate from the existing flag count in the PageHeader subtitle

---

## 10. Component Inventory

| Component               | Type   | Reused / New | Notes                 |
| ----------------------- | ------ | ------------ | --------------------- |
| `PageHeader`            | Server | Reused       | No changes needed     |
| `SidebarNavItem`        | Client | Reused       | Add one new entry     |
| `Sidebar`               | Client | Modified     | Add "Manual" nav item |
| `EmptyState`            | Server | Reused       | No changes needed     |
| `ManualRuleCard`        | Server | New          | Core new component    |
| `ManualPage`            | Server | New          | `/manual/page.tsx`    |
| `ManualLoadingSkeleton` | Server | New          | `/manual/loading.tsx` |

New files needed:

```
src/app/(app)/manual/page.tsx
src/app/(app)/manual/loading.tsx
src/components/manual-rule-card.tsx
```

Data / service layer (developer-defined, not UX scope):

```
src/lib/manual/manual.types.ts    — ManualRule type
src/lib/manual/manual-service.ts  — getRules(), violationFilterUrl() helper
```
