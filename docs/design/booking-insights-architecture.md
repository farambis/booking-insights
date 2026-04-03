# Booking Insights -- Technical Architecture

**Companion to:** [booking-insights-ux.md](./booking-insights-ux.md)

---

## Route Structure

```
src/app/(app)/                      # Route group -- app shell layout (topbar + sidebar)
  dashboard/page.tsx                # Dashboard overview
  bookings/page.tsx                 # Booking list (filtered via URL search params)
  bookings/[documentId]/page.tsx    # Booking detail
  manual/page.tsx                   # Booking Manual -- derived rules
  manual/[ruleId]/page.tsx          # Rule violations for a single rule
```

Each route has a colocated `loading.tsx` skeleton. The `(app)` route group keeps the shell layout separate from the root layout, allowing future routes (e.g., `/login`) to opt out. KPI cards on the dashboard are clickable links to filtered bookings. The topbar logo links to `/dashboard`.

---

## Component Architecture

### Server Components (data + layout)

- **Page components** (`DashboardPage`, `BookingsPage`, `BookingDetailPage`) -- await params/searchParams, call BookingService, pass resolved data as props
- **Display components** -- `KpiCard`, `KpiCardGrid`, `StatusBadge`, `BookingDataTable`, `FlagExplanationCard`, `RelatedBookings`, `RelatedBookingCard`, `AccountSummary`, `DocumentLinesTable`, `RecentCriticalTable`, `TopFlaggedAccounts`, `ResultsSummary`, `PageHeader`, `Topbar`, `ManualRuleCard`

### Client Components (`"use client"`)

- **FilterBar** and children (`SearchInput`, `StatusPillGroup`, `FlagTypeDropdown`, `AccountDropdown`, `AmountRange`, `DateRangePicker`) -- user input, debounce, URL push
- **BookingTable** -- sortable headers, row click navigation
- **Pagination** -- page navigation via URL
- **Sidebar** / **SidebarNavItem** -- `usePathname()` for active state
- **Charts** (`FlagDistributionChart`, `ActivityTimeChart`) -- Recharts requires client rendering

---

## Data Layer

### Service Interface

```typescript
// src/lib/bookings/booking-service.ts
export interface BookingService {
  getDashboardSummary(): Promise<DashboardSummary>;
  getCounts(): Promise<{
    totalDocuments: number;
    criticalCount: number;
    warningCount: number;
    cleanCount: number;
  }>;
  getBookings(
    filters: BookingFilters,
  ): Promise<PaginatedResult<BookingListItem>>;
  getBookingDetail(documentId: string): Promise<BookingDetail | null>;
  getRelatedContext(documentId: string): Promise<BookingRelatedContext>;
  getBookingManual(): Promise<BookingManual>;
  getRuleViolations(
    ruleId: string,
  ): Promise<{ rule: BookingRule; violations: BookingListItem[] } | null>;
}
```

MVP implementation: `local-booking-service.ts` transforms `journal-entries.json` + applies flag detection at module load time. Exported as `localBookingService` via `src/lib/bookings/index.ts`. Swap to a real API client by changing that single export.

### Flag Detection

Flag detection is split across multiple detector modules, each producing `BookingFlag` objects from journal entry lines:

- `text-anomaly-detector.ts` -- text typos (Levenshtein), unusual text-account combos, text-based duplicate postings
- `duplicate-detector.ts` -- multi-signal duplicate detection across 9 criteria
- `pattern-detectors.ts` -- unusual amounts, round number anomalies, pattern breaks
- `rule-violations.ts` -- violations of booking rules derived by the rule miner
- `flag-utils.ts` -- shared flag helpers and deduplication

Flag types: `duplicate_booking`, `missing_counterpart`, `unusual_amount`, `pattern_break`, `round_number_anomaly`, `text_typo`, `unusual_text_account`, `text_duplicate_posting`.

### Source Data

`src/lib/data/journal-entries.json` -- ~500 `JournalEntryLine` records (Jan-Feb 2025, company code 1000, EUR). No user/import/review fields exist in the source data -- those are post-MVP.

---

## File Structure

```
src/
  app/
    (app)/
      layout.tsx                    # App shell
      dashboard/page.tsx
      bookings/page.tsx
      bookings/[documentId]/page.tsx
      manual/page.tsx               # Booking Manual -- rule list
      manual/[ruleId]/page.tsx      # Rule violations for a single rule
  components/
    shell/                          # Topbar, Sidebar, SidebarNavItem
    filter-bar/                     # FilterBar + child filter controls
    charts/                         # FlagDistributionChart, ActivityTimeChart
    manual-rule-card.tsx            # Rule card for Manual page
    related-booking-card.tsx        # Inline related booking in detail view
    *.tsx                           # All other components (flat)
  lib/
    bookings/
      index.ts                      # Entrypoint: re-exports service + types
      booking.types.ts              # Domain types
      booking-service.ts            # Interface
      booking-queries.ts            # Filter, sort, paginate
      text-anomaly-detector.ts      # Text typos, unusual combos, text duplicates
      duplicate-detector.ts         # Multi-signal duplicate detection
      pattern-detectors.ts          # Unusual amounts, round numbers, pattern breaks
      rule-miner.ts                 # Derives booking rules from data
      rule-violations.ts            # Detects violations of derived rules
      rule.types.ts                 # BookingRule, RuleCategory, RuleScope types
      flag-utils.ts                 # Shared flag helpers + deduplication
      levenshtein.ts                # Levenshtein distance for text comparison
      local-booking-service.ts      # Local implementation (transforms journal entries)
      filter-params.ts              # URL param parsing/serialization
      format.ts                     # Display formatting helpers
    data/                           # Existing: journal-entries.json, account-master, types
    env.ts                          # Existing: t3-env validation
```

---

## Dependencies

Only new dependency: `recharts` (charts). Everything else uses built-in APIs (`Intl.DateTimeFormat` for dates, plain `<table>` for tables, URL search params for state, `zod` already installed for validation).
