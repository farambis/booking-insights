# Booking Insights -- Technical Architecture

**Date:** 2026-04-02
**Companion to:** [booking-insights-ux.md](./booking-insights-ux.md)
**Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4

---

## Table of Contents

1. [Route Structure](#1-route-structure)
2. [Component Architecture](#2-component-architecture)
3. [Data Layer](#3-data-layer)
4. [State Management](#4-state-management)
5. [Styling Architecture](#5-styling-architecture)
6. [File and Folder Structure](#6-file-and-folder-structure)
7. [Dependencies](#7-dependencies)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Route Structure

### Route Map

```
src/app/
  (app)/                        # Route group -- wraps all app pages in the shell layout
    layout.tsx                  # App shell: topbar + sidebar + main content area
    page.tsx                    # Redirect to /dashboard (or render dashboard inline)
    dashboard/
      page.tsx                  # View 1: Dashboard Overview
      loading.tsx               # Skeleton for dashboard (KPI cards + chart placeholders)
    bookings/
      page.tsx                  # View 2: Booking List
      loading.tsx               # Skeleton for booking table
      [documentId]/
        page.tsx                # View 3: Booking Detail
        loading.tsx             # Skeleton for detail page
```

### Design Decisions

**Route group `(app)` for the shell layout.** The root `layout.tsx` at `src/app/layout.tsx` handles `<html>`, `<body>`, fonts, and metadata. The `(app)` route group introduces the sidebar/topbar shell without adding a URL segment. This keeps the existing root layout untouched and avoids nesting the shell inside it for routes that may not need it later (e.g., a future `/login` page).

**`/dashboard` as an explicit route, not the root.** The root `/` redirects to `/dashboard`. This keeps URLs meaningful and allows future landing pages or auth flows at `/` without restructuring.

**`[documentId]` as the dynamic segment.** The data uses `document_id` (e.g., `"5000000058"`) as the identifier. The route resolves by that field: `/bookings/5000000058`.

### Next.js 16 API Notes

In Next.js 16, both `params` and `searchParams` in page components are `Promise` types:

```typescript
// src/app/(app)/bookings/page.tsx
export default async function BookingsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  // ...
}

// src/app/(app)/bookings/[documentId]/page.tsx
export default async function BookingDetailPage(props: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await props.params;
  // ...
}
```

---

## 2. Component Architecture

### Layer Overview

```
Page (Server Component)
  -- reads searchParams/params, fetches data, passes props down
  |
  +-- Layout sections (Server Components)
  |     Static structural wrappers, headings, cards
  |
  +-- Interactive islands (Client Components, "use client")
        Filters, search, table sorting, chart tooltips
```

The guiding principle: **the page component is the data boundary**. It awaits `searchParams`, calls the data service, and passes resolved data as props to child components. Child components -- whether server or client -- receive plain data, not promises.

### Component Breakdown by View

#### View 1: Dashboard (`/dashboard`)

| Component               | Location                                            | Server/Client | Responsibility                      |
| ----------------------- | --------------------------------------------------- | ------------- | ----------------------------------- |
| `DashboardPage`         | `src/app/(app)/dashboard/page.tsx`                  | Server        | Fetch summary data, compose layout  |
| `KpiCard`               | `src/components/kpi-card.tsx`                       | Server        | Display single metric with trend    |
| `KpiCardGrid`           | `src/components/kpi-card-grid.tsx`                  | Server        | 4-column responsive grid wrapper    |
| `FlagDistributionChart` | `src/components/charts/flag-distribution-chart.tsx` | **Client**    | Horizontal bar chart (Recharts)     |
| `TopFlaggedAccounts`    | `src/components/top-flagged-accounts.tsx`           | Server        | Ranked list with links              |
| `ActivityTimeChart`     | `src/components/charts/activity-time-chart.tsx`     | **Client**    | Line chart with date range selector |
| `RecentCriticalTable`   | `src/components/recent-critical-table.tsx`          | Server        | Compact 5-row table with links      |

#### View 2: Booking List (`/bookings`)

| Component          | Location                                           | Server/Client | Responsibility                                                   |
| ------------------ | -------------------------------------------------- | ------------- | ---------------------------------------------------------------- |
| `BookingsPage`     | `src/app/(app)/bookings/page.tsx`                  | Server        | Await searchParams, fetch filtered data, compose layout          |
| `FilterBar`        | `src/components/filter-bar/filter-bar.tsx`         | **Client**    | Search, date range, status pills, dropdowns, amount range, reset |
| `SearchInput`      | `src/components/filter-bar/search-input.tsx`       | **Client**    | Debounced text input                                             |
| `StatusPillGroup`  | `src/components/filter-bar/status-pill-group.tsx`  | **Client**    | All / Critical / Warning / Clean toggle                          |
| `FlagTypeDropdown` | `src/components/filter-bar/flag-type-dropdown.tsx` | **Client**    | Multi-select dropdown                                            |
| `AccountDropdown`  | `src/components/filter-bar/account-dropdown.tsx`   | **Client**    | Single-select with search                                        |
| `AmountRange`      | `src/components/filter-bar/amount-range.tsx`       | **Client**    | Min/max numeric inputs                                           |
| `DateRangePicker`  | `src/components/filter-bar/date-range-picker.tsx`  | **Client**    | Preset + custom date range                                       |
| `BookingTable`     | `src/components/booking-table.tsx`                 | **Client**    | Sortable table, row click navigation, sticky header              |
| `Pagination`       | `src/components/pagination.tsx`                    | **Client**    | Prev/next, page indicator, jump-to                               |
| `ResultsSummary`   | `src/components/results-summary.tsx`               | Server        | "Showing X of Y bookings" text                                   |

#### View 3: Booking Detail (`/bookings/[documentId]`)

| Component             | Location                                       | Server/Client | Responsibility                            |
| --------------------- | ---------------------------------------------- | ------------- | ----------------------------------------- |
| `BookingDetailPage`   | `src/app/(app)/bookings/[documentId]/page.tsx` | Server        | Fetch booking + related data              |
| `BookingDataTable`    | `src/components/booking-data-table.tsx`        | Server        | Key-value detail table                    |
| `FlagExplanationCard` | `src/components/flag-explanation-card.tsx`     | Server        | Flag details (read-only in MVP)           |
| `RelatedBookings`     | `src/components/related-bookings.tsx`          | Server        | Compact related booking cards             |
| `AccountSummary`      | `src/components/account-summary.tsx`           | Server        | Statistical context card                  |
| `DocumentLinesTable`  | `src/components/document-lines-table.tsx`      | Server        | All lines in the document + balance check |
| `StatusBadge`         | `src/components/status-badge.tsx`              | Server        | Badge variants (Critical/Warning/Clean)   |

#### Shell (shared across all views)

| Component        | Location                                    | Server/Client | Responsibility                                    |
| ---------------- | ------------------------------------------- | ------------- | ------------------------------------------------- |
| `AppShellLayout` | `src/app/(app)/layout.tsx`                  | Server        | Topbar + sidebar + content area wrapper           |
| `Topbar`         | `src/components/shell/topbar.tsx`           | Server        | Logo + user placeholder (no import button in MVP) |
| `Sidebar`        | `src/components/shell/sidebar.tsx`          | **Client**    | Nav items with active state (reads `usePathname`) |
| `SidebarNavItem` | `src/components/shell/sidebar-nav-item.tsx` | **Client**    | Single nav link with active styling               |
| `PageHeader`     | `src/components/page-header.tsx`            | Server        | Title, subtitle, action buttons slot              |

### Server/Client Boundary Rationale

**Client components are used only when strictly necessary:**

- `FilterBar` and its children: user input, debouncing, controlled form state
- `BookingTable`: click-to-sort headers, row click navigation via `useRouter`
- `Pagination`: page navigation updates URL
- `Sidebar`: reads `usePathname()` for active state highlighting
- Note: `FlagExplanationCard` and `DocumentLinesTable` are Server Components in MVP (read-only, no interactions)
- Charts: Recharts is a client-side rendering library

**Everything else stays as Server Components** -- KPI cards, data tables, badges, page headers, related bookings, account summary. These receive props and render. No interactivity, no hooks.

### Component Signatures

```typescript
// src/components/kpi-card.tsx
interface KpiCardProps {
  label: string;
  value: number;
  formattedValue: string;
  subtitle: string | null; // e.g. "425 lines", "4.8% of docs", "86.9%"
  variant: "default" | "critical" | "warning" | "clean";
}

// src/components/status-badge.tsx
interface StatusBadgeProps {
  status: "critical" | "warning" | "clean" | "info";
  size?: "default" | "large";
}

// src/components/flag-explanation-card.tsx
// MVP: read-only display — no action buttons (requires persistence layer)
interface FlagExplanationCardProps {
  flag: {
    type: FlagType;
    label: string;
    explanation: string;
    confidence: "high" | "medium" | "low";
    relatedDocumentId: string | null;
  };
}

// src/components/booking-table.tsx
interface BookingTableProps {
  bookings: BookingListItem[];
  totalCount: number;
  currentSort: { column: SortableColumn; direction: "asc" | "desc" };
}

// src/components/filter-bar/filter-bar.tsx
interface FilterBarProps {
  accounts: { number: string; name: string }[];
  flagTypes: { id: FlagType; label: string }[];
  currentFilters: BookingFilters;
}

// src/components/pagination.tsx
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}
```

---

## 3. Data Layer

### Architecture

```
src/lib/
  data/
    journal-entry.types.ts       # Existing: JournalEntryLine
    account-master.ts            # Existing: GL_ACCOUNTS, COST_CENTERS, etc.
    generate-entries.ts          # Existing: deterministic generator
    journal-entries.json         # Existing: pre-generated ~500 line items
  bookings/
    booking.types.ts             # Domain types for the Booking Insights feature
    booking-service.ts           # Data access layer -- the single point to swap mock for real
    booking-queries.ts           # Query/filter/sort/paginate logic over the dataset
    flag-engine.ts               # Flag detection logic (rules that produce flags from entries)
    mock-data.ts                 # Transforms journal-entries.json into Booking domain objects
    format.ts                    # Formatting helpers (amounts, dates, accounts)
```

### Domain Types

```typescript
// src/lib/bookings/booking.types.ts

/** Flag severity levels */
export type FlagSeverity = "critical" | "warning";

/** Flag type identifiers (snake_case for storage, display labels are separate) */
export type FlagType =
  | "duplicate_entry"
  | "missing_counterpart"
  | "unusual_amount"
  | "pattern_break"
  | "round_number_anomaly";

/** A detected flag on a booking */
export interface BookingFlag {
  type: FlagType;
  severity: FlagSeverity;
  explanation: string;
  confidence: number; // 0-1, mapped to "high"/"medium"/"low" at display time
  detectedAt: string; // ISO date
  relatedDocumentId: string | null;
}

/** Status derived from flags */
export type BookingStatus = "critical" | "warning" | "clean";

/** A single booking as displayed in the list view */
export interface BookingListItem {
  documentId: string;
  postingDate: string; // ISO date
  description: string;
  glAccount: string;
  glAccountName: string | null;
  contraAccount: string | null;
  contraAccountName: string | null;
  amount: number; // Signed: positive for debit, negative for credit
  currency: string;
  status: BookingStatus;
  flags: BookingFlag[];
  documentType: string;
}

/** Full booking detail (extends list item with additional context) */
export interface BookingDetail extends BookingListItem {
  lineId: number;
  companyCode: string;
  costCenter: string | null;
  costCenterName: string | null;
  bookingText: string;
  vendorId: string | null;
  customerId: string | null;
  taxCode: string | null;
  debitCredit: "S" | "H"; // Soll (debit) / Haben (credit)
  documentLines: DocumentLine[]; // all lines in the same document
}

/** A single line in a journal entry document */
export interface DocumentLine {
  lineId: number;
  glAccount: string;
  glAccountName: string | null;
  amount: number;
  debitCredit: "S" | "H";
  costCenter: string | null;
}

// NOTE: `importBatch` and `user` do not exist in the source data
// (JournalEntryLine). These are post-MVP fields that require a
// persistence layer to track who imported what and when.

/** Filters that map to URL search params */
export interface BookingFilters {
  search: string | null;
  status: BookingStatus | null;
  flagTypes: FlagType[];
  account: string | null;
  amountMin: number | null;
  amountMax: number | null;
  dateFrom: string | null; // ISO date
  dateTo: string | null; // ISO date
  page: number;
  sort: SortableColumn;
  sortDirection: "asc" | "desc";
}

export type SortableColumn =
  | "date"
  | "documentId"
  | "description"
  | "account"
  | "amount"
  | "status";

/** Dashboard summary data — all values derived from journal entries + flag engine */
export interface DashboardSummary {
  totalDocuments: number; // distinct document_id count
  totalLines: number; // total JournalEntryLine count
  criticalCount: number; // documents with at least one critical flag
  warningCount: number; // documents with warnings but no critical flags
  cleanCount: number; // documents with no flags
  cleanPercent: number; // cleanCount / totalDocuments * 100
  flagDistribution: { type: FlagType; label: string; count: number }[];
  topFlaggedAccounts: {
    account: string;
    accountName: string | null;
    flagCount: number;
  }[];
  /** Booking count per posting_date — for the activity timeline chart */
  activityByDate: {
    date: string; // ISO date from posting_date
    totalCount: number; // documents posted on this date
    flaggedCount: number; // flagged documents posted on this date
  }[];
  recentCritical: BookingListItem[]; // last 5 critical documents by posting_date
}

// NOTE: No period-over-period trends (e.g. "vs last week"). The dataset
// is a static import covering Jan–Feb 2025. Trends would require either
// multiple imports over time or a defined comparison window. The KPI cards
// show absolute counts and percentages instead.

/** Related bookings context for detail view */
export interface BookingRelatedContext {
  possibleDuplicate: BookingListItem | null;
  sameAccountRecent: BookingListItem[];
  accountSummary: {
    account: string;
    accountName: string | null;
    totalBookings: number;
    flaggedCount: number;
    flaggedPercent: number;
    averageAmount: number;
    currentAmount: number;
    vsAverage: { percent: number; severity: "normal" | "elevated" | "high" };
  };
}

/** Paginated result wrapper */
export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ActivityLogEntry removed — MVP has no persistence layer for user actions.
// The detail view shows DocumentLine[] (all lines in the document) instead.
```

### Service Layer (the swappable boundary)

```typescript
// src/lib/bookings/booking-service.ts

import type {
  BookingDetail,
  BookingFilters,
  BookingListItem,
  BookingRelatedContext,
  DashboardSummary,
  PaginatedResult,
} from "./booking.types";

export interface BookingService {
  getDashboardSummary(): Promise<DashboardSummary>;
  getBookings(
    filters: BookingFilters,
  ): Promise<PaginatedResult<BookingListItem>>;
  /** Returns full detail including all document lines (for the double-entry view) */
  getBookingDetail(documentId: string): Promise<BookingDetail | null>;
  getRelatedContext(documentId: string): Promise<BookingRelatedContext>;
}
```

For MVP, a single module exports a concrete implementation that reads from the pre-generated JSON and applies flag detection in-memory:

```typescript
// src/lib/bookings/mock-data.ts

import journalEntries from "@/lib/data/journal-entries.json";
import { GL_ACCOUNTS, COST_CENTERS } from "@/lib/data/account-master";
import type { BookingService } from "./booking-service";
import { applyFlags } from "./flag-engine";
import {
  queryBookings,
  buildDashboardSummary,
  findRelated,
} from "./booking-queries";

// Transform raw JournalEntryLine[] into BookingListItem[] with flags applied
// This happens once at module load time (module-level cache)
const allBookings = transformAndFlag(journalEntries);

export const mockBookingService: BookingService = {
  async getDashboardSummary() {
    return buildDashboardSummary(allBookings);
  },
  async getBookings(filters) {
    return queryBookings(allBookings, filters);
  },
  async getBookingDetail(documentId) {
    return allBookings.find((b) => b.documentId === documentId) ?? null;
  },
  async getRelatedContext(documentId) {
    return findRelated(allBookings, documentId);
  },
};
```

The page components import via a single entrypoint:

```typescript
// src/lib/bookings/index.ts
export { mockBookingService as bookingService } from "./mock-data";
export type * from "./booking.types";
```

**When a real backend arrives:** replace the export in `index.ts` to point at an API client implementation of `BookingService`. No page or component code changes needed.

### Data Grounding — Source Schema

All data comes from `src/lib/data/journal-entries.json`, generated by `scripts/generate-journal-entries.ts`. Each entry is a `JournalEntryLine` with these fields:

| Field           | Type           | Example                   | Notes                                        |
| --------------- | -------------- | ------------------------- | -------------------------------------------- |
| `company_code`  | string         | `"1000"`                  | Always "1000" in this dataset                |
| `posting_date`  | string         | `"2025-01-15"`            | ISO date, range: 2025-01-01 to 2025-02-28    |
| `document_id`   | string         | `"5000000001"`            | Unique per document, sequential              |
| `line_id`       | number         | `1`                       | Sequential within document                   |
| `gl_account`    | string         | `"060000"`                | 6-digit zero-padded                          |
| `cost_center`   | string \| null | `"3000"`                  | Only on expense accounts                     |
| `amount`        | number         | `1404.17`                 | Always positive (direction via debit_credit) |
| `currency`      | string         | `"EUR"`                   | Always EUR                                   |
| `debit_credit`  | `"S"` \| `"H"` | `"S"`                     | Soll=debit, Haben=credit                     |
| `booking_text`  | string         | `"Lieferant Müller GmbH"` | German descriptions                          |
| `vendor_id`     | string \| null | `"V0007"`                 | V0001–V0008                                  |
| `customer_id`   | string \| null | `"C0001"`                 | C0001–C0006                                  |
| `tax_code`      | string \| null | `"V19"`                   | V19=input VAT, A19=output VAT                |
| `document_type` | string         | `"KR"`                    | KR, DR, KZ, DZ, SA, AB                       |

**Account range assumptions** (from `src/lib/data/account-master.ts`):

| Range         | Category                        | Flag engine relevance                              |
| ------------- | ------------------------------- | -------------------------------------------------- |
| 010000–019999 | Assets (Anlagevermögen)         | High amounts normal; flag unusually small amounts  |
| 020000–029999 | Receivables (Forderungen)       | Includes input VAT (020200)                        |
| 030000–039999 | Liabilities (Verbindlichkeiten) | Includes output VAT, payroll tax, social insurance |
| 040000–049999 | Revenue (Umsatzerlöse)          | Normally credit side; debit = reversal or error    |
| 050000–059999 | COGS (Wareneinsatz)             | Normally debit side                                |
| 060000–069999 | Personnel (Personalaufwand)     | Normally debit; vendor text here is suspicious     |
| 070000–079999 | Operating expenses              | 12 sub-accounts; normally debit                    |
| 080000–089999 | Tax & other                     | Infrequent; flag unexpected amounts                |
| 090000–099999 | Bank & cash                     | Contra account for payments                        |

**What does NOT exist in the data:**

- No `user` or `created_by` field — we don't know who created a booking
- No `import_batch` or `imported_at` — we don't track import history
- No `reviewed` or `false_positive` status — no persistence for user decisions
- No historical comparison data — single static dataset, no time-series trends

### Flag Engine

The `flag-engine.ts` module contains pure functions that analyze journal entry lines and produce `BookingFlag` objects. This is separated from data loading so the detection rules can be tested in isolation.

Flag detection rules for MVP:

1. **Duplicate entry** -- same account, similar amount (within 5%), within 2 days
2. **Unusual amount** -- amount exceeds 2x the account's average
3. **Round number anomaly** -- amount is a suspiciously round number (e.g., exactly 10000.00) for an account that normally has variable amounts
4. **Pattern break** -- account/debit_credit combination that violates expected norms (e.g., revenue account 040xxx on debit side, or personnel account 060xxx with a customer_id). Uses ACCOUNT_RANGES to determine expected debit/credit direction per category
5. **Missing counterpart** -- a document with only debit or only credit lines (should not happen in double-entry)

The existing `generate-entries.ts` already plants specific anomalies (typos, near-duplicates, unusual combos). The flag engine formalizes detection of these.

### Formatting Helpers

```typescript
// src/lib/bookings/format.ts

/** Format amount with 2 decimals, thousand separator, and currency */
export function formatAmount(amount: number, currency?: string): string;

/** Format ISO date to DD.MM.YYYY */
export function formatDateCompact(isoDate: string): string;

/** Format ISO date to "31. Marz 2026" */
export function formatDateVerbose(isoDate: string): string;

/** Map FlagType to human-readable label */
export function flagTypeLabel(type: FlagType): string;

/** Map confidence score to "High" | "Medium" | "Low" */
export function confidenceLabel(score: number): string;

/** Format account as "060000 -- Gehalter" or just "060000" if no name */
export function formatAccount(number: string, name: string | null): string;
```

---

## 4. State Management

### Principle: URL is the single source of truth for filters

All filter state lives in the URL search params. This satisfies the UX spec requirements:

- Shareable filtered views
- Back button preserves filters
- "Back to Bookings" from detail preserves filter state

### URL Search Param Schema

```
/bookings?search=Muller&status=critical&flags=duplicate_entry,unusual_amount&account=060000&amountMin=500&amountMax=5000&dateFrom=2025-01-01&dateTo=2025-02-28&page=1&sort=date&dir=desc
```

| Param       | Type                                 | Default  | Notes            |
| ----------- | ------------------------------------ | -------- | ---------------- |
| `search`    | string                               | (empty)  | Free-text search |
| `status`    | `"critical" \| "warning" \| "clean"` | (all)    | Single-select    |
| `flags`     | comma-separated `FlagType`           | (all)    | Multi-select     |
| `account`   | string                               | (all)    | Account number   |
| `amountMin` | number                               | (none)   | Minimum amount   |
| `amountMax` | number                               | (none)   | Maximum amount   |
| `dateFrom`  | `YYYY-MM-DD`                         | (none)   | Range start      |
| `dateTo`    | `YYYY-MM-DD`                         | (none)   | Range end        |
| `page`      | number                               | `1`      | Current page     |
| `sort`      | `SortableColumn`                     | `"date"` | Sort column      |
| `dir`       | `"asc" \| "desc"`                    | `"desc"` | Sort direction   |

### Parsing and Serializing

```typescript
// src/lib/bookings/filter-params.ts

import type { BookingFilters } from "./booking.types";

const PAGE_SIZE = 50;

/** Parse raw searchParams into typed BookingFilters with defaults */
export function parseBookingFilters(
  raw: Record<string, string | string[] | undefined>,
): BookingFilters;

/** Serialize BookingFilters back to URLSearchParams (omitting defaults) */
export function serializeBookingFilters(
  filters: Partial<BookingFilters>,
): URLSearchParams;

/** Produce a pathname + search string for navigation */
export function bookingListUrl(filters: Partial<BookingFilters>): string;
```

### Data Flow: Server-Side

```
1. User navigates to /bookings?status=critical&page=2
2. Next.js renders BookingsPage (Server Component)
3. BookingsPage awaits searchParams Promise
4. parseBookingFilters(searchParams) -> typed BookingFilters
5. bookingService.getBookings(filters) -> PaginatedResult
6. Pass resolved data as props to FilterBar, BookingTable, Pagination
```

### Data Flow: Client-Side Filter Updates

The `FilterBar` is a Client Component. When the user changes a filter:

```
1. User types in search or selects a status pill
2. FilterBar builds new filter state locally (React state for debounce only)
3. After debounce (300ms for search, immediate for pills/dropdowns):
   a. Call serializeBookingFilters(newFilters)
   b. Use router.push(bookingListUrl(newFilters)) to update URL
4. Next.js re-renders the BookingsPage Server Component with new searchParams
5. Server fetches data with new filters
6. New props flow down
```

This means the `FilterBar` needs `useRouter` and `useSearchParams` from `next/navigation`. It reads the current filters from the URL (via the `currentFilters` prop parsed by the parent server component) and pushes new URLs on change.

### Client-Side State (minimal)

| What                               | Where                                                  | Why not URL                                                                           |
| ---------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Search input value during debounce | `useState` in `SearchInput`                            | 300ms debounce before URL push; intermediate keystrokes should not trigger navigation |
| Dropdown open/closed               | `useState` in each dropdown                            | Transient UI state, meaningless in URL                                                |
| Toast notifications                | `useState` in a toast provider or layout-level context | Ephemeral feedback, no persistence                                                    |
| Detail page: note input value      | `useState` in `ActivityLog`                            | Unsaved draft                                                                         |

No global state management library is needed. There is no cross-cutting state that URL params + component-local state cannot handle.

---

## 5. Styling Architecture

### Tailwind CSS 4 Theme Configuration

Replace the current `globals.css` with the design system tokens. The UX spec provides the exact values and the recommended `@theme inline` approach.

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme inline {
  /* Brand */
  --color-brand: #006fd6;
  --color-brand-dim: #005ab0;
  --color-brand-tint: #e6f2fc;

  /* Surfaces */
  --color-surface: #ffffff;
  --color-background: #f4f7fa;

  /* Neutral scale */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f4f7fa;
  --color-neutral-100: #eef1f5;
  --color-neutral-200: #e2e6eb;
  --color-neutral-300: #c8cdd5;
  --color-neutral-500: #737880;
  --color-neutral-700: #4a4e55;
  --color-neutral-900: #1a1a1a;

  /* Status: Critical */
  --color-critical: #dc2626;
  --color-critical-bg: #fef2f2;
  --color-critical-border: #fecaca;

  /* Status: Warning */
  --color-warning: #d97706;
  --color-warning-bg: #fffbeb;
  --color-warning-border: #fde68a;

  /* Status: Clean */
  --color-clean: #16a34a;
  --color-clean-bg: #f0fdf4;
  --color-clean-border: #bbf7d0;

  /* Status: Info */
  --color-info: #2563eb;
  --color-info-bg: #eff6ff;
  --color-info-border: #bfdbfe;

  /* Fonts (already configured in layout.tsx) */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--color-background);
  color: var(--color-neutral-900);
  font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
}
```

This enables utility classes like `bg-brand`, `text-critical`, `border-warning-border`, `bg-neutral-100`, etc. throughout the entire application with no further configuration.

### Remove Dark Mode

The UX spec explicitly states light-mode only for MVP. Remove the `prefers-color-scheme: dark` media query from `globals.css` and the `dark:` utility classes from `layout.tsx`.

### Component Variant Patterns

Use a mapping object pattern rather than complex ternary chains. Keep this colocated with the component that uses it.

```typescript
// Inside status-badge.tsx
const VARIANT_STYLES = {
  critical: "bg-critical-bg text-critical border-critical-border",
  warning: "bg-warning-bg text-warning border-warning-border",
  clean: "bg-clean-bg text-clean border-clean-border",
  info: "bg-info-bg text-info border-info-border",
} as const;

const SIZE_STYLES = {
  default: "text-xs px-2 py-0.5",
  large: "text-sm px-3 py-1",
} as const;
```

The same pattern applies to `KpiCard` variants, table row tinting, and flag explanation card border colors.

### Class Merging

For combining conditional classes, use template literals. A utility like `clsx` is lightweight enough to add if ternaries become unwieldy, but start without it -- the project's variant count is small.

---

## 6. File and Folder Structure

```
src/
  app/
    layout.tsx                          # Root: <html>, <body>, fonts, metadata
    globals.css                         # Tailwind + theme tokens
    page.tsx                            # Root redirect to /dashboard
    not-found.tsx                       # Existing 404
    error.tsx                           # Existing route error boundary
    global-error.tsx                    # Existing root error boundary
    favicon.ico
    (app)/
      layout.tsx                        # App shell: Topbar + Sidebar + <main>
      dashboard/
        page.tsx                        # Dashboard overview
        loading.tsx                     # Dashboard skeleton
      bookings/
        page.tsx                        # Booking list
        loading.tsx                     # Table skeleton
        [documentId]/
          page.tsx                      # Booking detail
          loading.tsx                   # Detail skeleton

  components/
    shell/
      topbar.tsx
      sidebar.tsx
      sidebar-nav-item.tsx
    page-header.tsx
    kpi-card.tsx
    kpi-card-grid.tsx
    status-badge.tsx
    booking-table.tsx
    pagination.tsx
    results-summary.tsx
    booking-data-table.tsx
    flag-explanation-card.tsx
    related-bookings.tsx
    related-booking-card.tsx
    account-summary.tsx
    document-lines-table.tsx
    recent-critical-table.tsx
    top-flagged-accounts.tsx
    empty-state.tsx
    filter-bar/
      filter-bar.tsx
      search-input.tsx
      status-pill-group.tsx
      flag-type-dropdown.tsx
      account-dropdown.tsx
      amount-range.tsx
      date-range-picker.tsx
    charts/
      flag-distribution-chart.tsx
      activity-time-chart.tsx

  lib/
    env.ts                              # Existing: t3-env validation
    data/
      journal-entry.types.ts            # Existing
      account-master.ts                 # Existing
      generate-entries.ts               # Existing
      journal-entries.json              # Existing
    bookings/
      index.ts                          # Re-exports bookingService + types
      booking.types.ts                  # All domain types
      booking-service.ts                # BookingService interface
      booking-queries.ts                # Filter, sort, paginate logic
      flag-engine.ts                    # Flag detection rules
      mock-data.ts                      # Mock implementation of BookingService
      filter-params.ts                  # URL searchParam parsing/serializing
      format.ts                         # Display formatting helpers
```

### Naming Conventions (matching CLAUDE.md)

- **Files:** kebab-case (`flag-explanation-card.tsx`, `booking-service.ts`)
- **React components:** PascalCase exports (`FlagExplanationCard`, `KpiCard`)
- **Types/interfaces:** PascalCase (`BookingListItem`, `BookingFilters`)
- **Test files:** colocated, `*.test.ts` / `*.test.tsx` pattern
- **Imports:** `@/` alias everywhere (`@/components/status-badge`, `@/lib/bookings`)

---

## 7. Dependencies

### New Dependencies to Add

| Package    | Purpose                        | Why this one                                                                                                              |
| ---------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `recharts` | Charts (bar chart, line chart) | UX spec suggests it. Lightweight, React-native, good Server Component story (wrap in Client Component). No complex setup. |

```bash
npm install recharts
```

That is the only addition.

### Packages Considered and Rejected

| Package                   | Reason for rejection                                                                                                                                                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@tanstack/react-table`   | The table has 7 columns with simple sorting. A plain `<table>` with a sort handler is sufficient. TanStack Table adds conceptual overhead that is not justified at this column count. Revisit if the table grows past ~15 columns or gains column resizing/reordering. |
| `date-fns` / `dayjs`      | Date formatting needs are limited (DD.MM.YYYY, verbose German month). `Intl.DateTimeFormat` with `"de-DE"` locale handles this natively. No library needed.                                                                                                            |
| `clsx` / `tailwind-merge` | The variant set is small enough for template literals. If the project grows past ~20 components with complex conditional styling, add `clsx` (413 bytes).                                                                                                              |
| `zustand` / `jotai`       | No global client state beyond URL params. Premature for this feature.                                                                                                                                                                                                  |
| `react-day-picker`        | The date range picker can start as a simple native `<input type="date">` with preset buttons. A full calendar picker is a post-MVP polish item.                                                                                                                        |

### Existing Dependencies That Are Sufficient

- `zod`: Already installed. Use for any runtime validation needed (e.g., validating search params).
- `next/navigation`: Built-in. Provides `useRouter`, `useSearchParams`, `usePathname`, `Link`.
- `next/image`: Built-in. Already used in current `page.tsx`.

---

## 8. Implementation Roadmap

### Phase 1: Foundation (do first -- everything depends on this)

**Goal:** Data layer works, theme is in place, shell layout renders.

1. **`src/lib/bookings/booking.types.ts`** -- Define all domain types
2. **`src/lib/bookings/format.ts`** -- Formatting helpers (amounts, dates, accounts, flag labels)
3. **`src/lib/bookings/flag-engine.ts`** -- Flag detection rules that consume `JournalEntryLine[]`
4. **`src/lib/bookings/mock-data.ts`** -- Transform JSON + apply flags
5. **`src/lib/bookings/booking-queries.ts`** -- Filter, sort, paginate over `BookingListItem[]`
6. **`src/lib/bookings/filter-params.ts`** -- URL param parsing/serialization
7. **`src/lib/bookings/booking-service.ts`** -- Interface definition
8. **`src/lib/bookings/index.ts`** -- Entrypoint re-export
9. **`src/app/globals.css`** -- Replace with full theme tokens
10. **`src/app/(app)/layout.tsx`** -- App shell with topbar, sidebar, main area
11. **`src/components/shell/`** -- Topbar, Sidebar, SidebarNavItem

**Tests:** Unit tests for `flag-engine.ts`, `booking-queries.ts`, `filter-params.ts`, `format.ts`.

### Phase 2: Booking List (highest user value -- the primary work surface)

**Goal:** Users can browse, filter, and sort bookings.

1. **`src/components/status-badge.tsx`** -- Used everywhere
2. **`src/components/page-header.tsx`** -- Used on every page
3. **`src/components/empty-state.tsx`** -- Used for no-results
4. **`src/components/filter-bar/*`** -- All filter components
5. **`src/components/booking-table.tsx`** -- Sortable table with row tinting
6. **`src/components/pagination.tsx`** -- Page controls
7. **`src/components/results-summary.tsx`** -- Count display
8. **`src/app/(app)/bookings/page.tsx`** -- Wire it all together
9. **`src/app/(app)/bookings/loading.tsx`** -- Table skeleton

**Tests:** Component tests for `FilterBar` (URL updates on interaction), `BookingTable` (sort toggling), `StatusBadge` (variant rendering).

### Phase 3: Booking Detail (completes the triage flow)

**Goal:** Users can click a booking and see full context.

1. **`src/components/booking-data-table.tsx`** -- Key-value pairs
2. **`src/components/flag-explanation-card.tsx`** -- Flag details + actions
3. **`src/components/related-booking-card.tsx`** -- Compact card
4. **`src/components/related-bookings.tsx`** -- Panel with cards
5. **`src/components/account-summary.tsx`** -- Statistical context
6. **`src/components/document-lines-table.tsx`** -- All lines in document + balance check
7. **`src/app/(app)/bookings/[documentId]/page.tsx`** -- Compose detail view
8. **`src/app/(app)/bookings/[documentId]/loading.tsx`** -- Detail skeleton

**Tests:** Component tests for `FlagExplanationCard` (action callbacks), `AccountSummary` (vs-average severity coloring).

### Phase 4: Dashboard (summary view -- depends on all data being flagged)

**Goal:** Dashboard with KPIs, charts, and quick links.

1. **`npm install recharts`**
2. **`src/components/kpi-card.tsx`** + **`kpi-card-grid.tsx`**
3. **`src/components/charts/flag-distribution-chart.tsx`**
4. **`src/components/charts/activity-time-chart.tsx`**
5. **`src/components/top-flagged-accounts.tsx`**
6. **`src/components/recent-critical-table.tsx`**
7. **`src/app/(app)/dashboard/page.tsx`** -- Compose dashboard
8. **`src/app/(app)/dashboard/loading.tsx`** -- KPI + chart skeletons
9. **`src/app/page.tsx`** -- Change root page to redirect to `/dashboard`

**Tests:** Component tests for `KpiCard` (variant rendering, trend display). Snapshot or visual tests for charts are optional at MVP.

### Phase 5: Polish

1. Responsive behavior (tablet sidebar collapse, 2x2 KPI grid)
2. Mobile gate message
3. Toast notifications for actions
4. Loading skeleton refinements
5. Keyboard navigation (Escape on detail page)
6. Empty state variants (no data, all clean)

---

## Appendix: Trade-off Analysis Log

### A. Data Fetching: In-Memory Mock vs. Route Handlers

| Criterion            | In-memory (chosen)                              | Route handlers (`/api/bookings`)                                             |
| -------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| Implementation speed | Fast -- direct function calls                   | Slower -- need to define API routes, fetch from them                         |
| Type safety          | Full -- shared types, no serialization boundary | Partial -- need to parse responses                                           |
| Swap to real backend | Change one export in `index.ts`                 | Already have the HTTP layer, but it is to a mock                             |
| SSR compatibility    | Works directly in Server Components             | Fetching own API routes from Server Components is an anti-pattern in Next.js |
| Realism              | Lower -- no network latency simulation          | Slightly higher                                                              |

**Decision:** In-memory mock with a `BookingService` interface. The interface contract is what matters for swappability, not the transport layer. When a real backend exists, the implementation will use `fetch()` or a client SDK internally.

### B. Filter State: URL Params vs. React Context

| Criterion        | URL params (chosen)                         | React Context                                              |
| ---------------- | ------------------------------------------- | ---------------------------------------------------------- |
| Shareability     | URLs are shareable by definition            | Not shareable without extra work                           |
| Back button      | Free -- browser handles it                  | Must implement custom history                              |
| Server rendering | searchParams available in Server Components | Requires Client Component wrapper for all filtered content |
| Complexity       | parseBookingFilters is ~40 lines            | Context provider + useReducer is comparable                |
| Persistence      | Survives refresh, tab close                 | Lost on refresh                                            |

**Decision:** URL params. It is strictly superior for this use case. The UX spec explicitly requires shareable filter URLs.

### C. Table Implementation: HTML Table vs. Library

| Criterion             | Plain `<table>` (chosen) | @tanstack/react-table        |
| --------------------- | ------------------------ | ---------------------------- |
| Bundle size           | 0 bytes added            | ~13 KB                       |
| 7-column sort         | Trivial custom hook      | Fully covered                |
| Column resize/reorder | Not supported            | Supported                    |
| Virtualization        | Not supported            | Supported via plugin         |
| Learning curve        | None                     | Moderate (headless paradigm) |

**Decision:** Plain `<table>` with a custom sort handler. The table has 7 fixed columns and 50 rows per page. Virtualization and column manipulation are not needed. If requirements grow to include column customization, reconsider.

### D. Chart Library: Recharts vs. Others

| Criterion               | Recharts (chosen)       | Chart.js / react-chartjs-2 | Visx                      |
| ----------------------- | ----------------------- | -------------------------- | ------------------------- |
| React integration       | Native React components | Canvas-based wrapper       | Native SVG primitives     |
| Bundle size             | ~50 KB                  | ~65 KB                     | Variable (tree-shakeable) |
| Horizontal bar chart    | Built-in                | Built-in                   | Manual assembly           |
| Line chart with tooltip | Built-in                | Built-in                   | Manual assembly           |
| Accessibility           | Decent (SVG)            | Limited (Canvas)           | Best (SVG, full control)  |
| Setup time              | Minimal                 | Minimal                    | Significant               |

**Decision:** Recharts. It covers both chart types with minimal configuration. Visx would produce better results but requires significantly more code for the same output, which is not justified at MVP.
