# Northscope Architecture

## Data Flow

```
journal-entries.json
        |
   flag-engine.ts          (pure functions: detect anomalies from raw lines)
        |
   mock-data.ts            (transform + flag at module load; cached in memory)
        |
   BookingService          (interface: getDashboardSummary, getBookings, getBookingDetail, getRelatedContext)
        |
   Server Components       (pages await searchParams, call service, pass plain data down)
        |
   Client Components       (filters, charts, sortable table -- push URL changes via router)
```

## Key Architectural Decisions

**BookingService interface as the swap boundary.**
All data access goes through a single `BookingService` interface (`src/lib/bookings/booking-service.ts`). The MVP implementation reads from static JSON in-memory. When a real backend arrives, replace the export in `src/lib/bookings/index.ts` -- no page or component code changes.

**URL-driven filter state.**
All filter/sort/pagination state lives in URL search params. Pages are Server Components that parse `searchParams`, call the service, and pass resolved data as props. Client Components read current filters from props and push new URLs on change. No global state library.

**Server/Client boundary.**
Default to Server Components. `"use client"` only for: FilterBar (user input + debounce), BookingTable (click-to-sort, row navigation), Pagination (URL updates), Sidebar (usePathname), Charts (Recharts requires client rendering). Everything else is a Server Component receiving props.

**Module-level caching.**
`mock-data.ts` transforms and flags all journal entries once at module load time. All subsequent service calls operate on this cached array. Acceptable for a static dataset of ~500 lines; would not scale to a real backend (where the service would make API calls instead).

## MVP-Only vs. Permanent

| Decision                                            | MVP-only | Permanent                       |
| --------------------------------------------------- | -------- | ------------------------------- |
| In-memory mock data behind BookingService interface | x        |                                 |
| BookingService interface contract                   |          | x                               |
| URL search params for filter state                  |          | x                               |
| Server Component pages as data boundary             |          | x                               |
| Module-level cache of transformed data              | x        |                                 |
| Static JSON as data source                          | x        |                                 |
| Recharts for charts                                 |          | x (unless scale demands change) |
| No auth, no persistence for user actions            | x        |                                 |
