# Booking Insights -- Technical Architecture

**Companion to:** [booking-insights-ux.md](./booking-insights-ux.md)

---

## Route Structure

```
src/app/(app)/                  # Route group -- app shell layout (topbar + sidebar)
  dashboard/page.tsx            # Dashboard overview
  bookings/page.tsx             # Booking list (filtered via URL search params)
  bookings/[documentId]/page.tsx  # Booking detail
```

Each route has a colocated `loading.tsx` skeleton. The `(app)` route group keeps the shell layout separate from the root layout, allowing future routes (e.g., `/login`) to opt out.

---

## Component Architecture

### Server Components (data + layout)

- **Page components** (`DashboardPage`, `BookingsPage`, `BookingDetailPage`) -- await params/searchParams, call BookingService, pass resolved data as props
- **Display components** -- `KpiCard`, `KpiCardGrid`, `StatusBadge`, `BookingDataTable`, `FlagExplanationCard`, `RelatedBookings`, `AccountSummary`, `DocumentLinesTable`, `RecentCriticalTable`, `TopFlaggedAccounts`, `ResultsSummary`, `PageHeader`, `Topbar`

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
  getBookings(
    filters: BookingFilters,
  ): Promise<PaginatedResult<BookingListItem>>;
  getBookingDetail(documentId: string): Promise<BookingDetail | null>;
  getRelatedContext(documentId: string): Promise<BookingRelatedContext>;
}
```

MVP implementation: `mock-data.ts` transforms `journal-entries.json` + applies flag detection at module load time. Exported via `src/lib/bookings/index.ts`. Swap to a real API client by changing that single export.

### Flag Engine

Pure functions in `flag-engine.ts` that produce `BookingFlag` objects from journal entry lines. Five rules: duplicate entry, unusual amount, round number anomaly, pattern break, missing counterpart.

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
  components/
    shell/                          # Topbar, Sidebar, SidebarNavItem
    filter-bar/                     # FilterBar + child filter controls
    charts/                         # FlagDistributionChart, ActivityTimeChart
    *.tsx                           # All other components (flat)
  lib/
    bookings/
      index.ts                      # Entrypoint: re-exports service + types
      booking.types.ts              # Domain types
      booking-service.ts            # Interface
      booking-queries.ts            # Filter, sort, paginate
      flag-engine.ts                # Flag detection rules
      mock-data.ts                  # Mock implementation
      filter-params.ts              # URL param parsing/serialization
      format.ts                     # Display formatting helpers
    data/                           # Existing: journal-entries.json, account-master, types
    env.ts                          # Existing: t3-env validation
```

---

## Dependencies

Only new dependency: `recharts` (charts). Everything else uses built-in APIs (`Intl.DateTimeFormat` for dates, plain `<table>` for tables, URL search params for state, `zod` already installed for validation).
