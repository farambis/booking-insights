# Buchungsdaten

Die App arbeitet mit generierten Journal Entries (`journal-entries.json`). Die Daten sind bereits im Repo enthalten.

## Neu generieren

```bash
npm run generate:data
```

Das Script ist deterministisch (Seed 42) — jeder Lauf erzeugt identische Daten. Absichtlich eingebaute Anomalien (Tippfehler, Doppelbuchungen, ungewöhnliche Kombinationen) werden bei der Generierung auf stdout geloggt.

## Datenmodell

Jede Zeile ist eine Belegposition (`JournalEntryLine`):

| Feld | Beschreibung |
|------|-------------|
| `company_code` | Buchungskreis (z.B. "1000") |
| `posting_date` | Buchungsdatum |
| `document_id` | Belegnummer |
| `line_id` | Positionsnummer |
| `gl_account` | Sachkonto (6-stellig, zero-padded) |
| `cost_center` | Kostenstelle (nullable) |
| `amount` | Betrag (immer positiv, Richtung via `debit_credit`) |
| `currency` | Währung |
| `debit_credit` | "S" (Soll) / "H" (Haben) |
| `booking_text` | Buchungstext |
| `vendor_id` | Lieferant (nullable) |
| `customer_id` | Kunde (nullable) |
| `tax_code` | Steuercode (nullable) |
| `document_type` | Belegart (KR, DR, KZ, DZ, SA, AB) |

Jeder Beleg ist ausgeglichen (Summe Soll = Summe Haben).

## Kontenlogik

Die Kontenbereiche und das Kontenverzeichnis sind in `account-master.ts` definiert.
