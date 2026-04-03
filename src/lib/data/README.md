# Booking Data

The app works with generated journal entries (`journal-entries.json`). The data is already included in the repo.

## Regenerating

```bash
npm run generate:data
```

The script is deterministic (seed 42) — every run produces identical data. Intentionally planted anomalies (typos, double postings, unusual combinations) are logged to stdout during generation.

## Data Model

Each row is a journal entry line item (`JournalEntryLine`):

| Field | Description |
|-------|-------------|
| `company_code` | Company code (e.g., "1000") |
| `posting_date` | Posting date |
| `document_id` | Document number |
| `line_id` | Line item number |
| `gl_account` | GL account (6-digit, zero-padded) |
| `cost_center` | Cost center (nullable) |
| `amount` | Amount (always positive, direction via `debit_credit`) |
| `currency` | Currency |
| `debit_credit` | "S" (debit/Soll) / "H" (credit/Haben) |
| `booking_text` | Booking description |
| `vendor_id` | Vendor (nullable) |
| `customer_id` | Customer (nullable) |
| `tax_code` | Tax code (nullable) |
| `document_type` | Document type (KR, DR, KZ, DZ, SA, AB) |

Every document is balanced (sum of debits = sum of credits).

## Chart of Accounts

Account ranges and the GL account directory are defined in `account-master.ts`.
