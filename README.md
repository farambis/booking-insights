# Booking Insights

Finanz-Analyse-App auf Basis von Buchungsdaten (Journal Entries) im SAP-Stil.

**Live Demo:** https://booking-insights-farambis-projects.vercel.app

## Setup

```bash
npm install
```

## Entwicklung

```bash
npm run dev         # Dev-Server starten (Turbopack)
npm run build       # Production Build
npm run lint        # ESLint
npm run typecheck   # TypeScript prüfen
npm run test        # Vitest im Watch-Mode
npm run test:run    # Vitest einmalig
npm run format      # Prettier auf alle Dateien
```

## Buchungsdaten generieren

Die App arbeitet mit generierten Journal Entries (`src/lib/data/journal-entries.json`). Die Daten sind bereits im Repo enthalten. Um sie neu zu generieren:

```bash
npm run generate:data
```

Das Script ist deterministisch (Seed 42) — jeder Lauf erzeugt identische Daten. Absichtlich eingebaute Anomalien (Tippfehler, Doppelbuchungen, ungewöhnliche Kombinationen) werden bei der Generierung auf stdout geloggt.

### Datenmodell

Jede Zeile ist eine Belegposition mit:

| Feld            | Beschreibung                      |
| --------------- | --------------------------------- |
| `company_code`  | Buchungskreis (z.B. "1000")       |
| `posting_date`  | Buchungsdatum                     |
| `document_id`   | Belegnummer                       |
| `line_id`       | Positionsnummer                   |
| `gl_account`    | Sachkonto (6-stellig)             |
| `cost_center`   | Kostenstelle                      |
| `amount`        | Betrag (immer positiv)            |
| `currency`      | Währung                           |
| `debit_credit`  | "S" (Soll) / "H" (Haben)          |
| `booking_text`  | Buchungstext                      |
| `document_type` | Belegart (KR, DR, KZ, DZ, SA, AB) |

Jeder Beleg ist ausgeglichen (Summe Soll = Summe Haben).

### Kontenlogik

Die Kontenbereiche und das Kontenverzeichnis sind in `src/lib/data/account-master.ts` definiert und dokumentiert.

## Exercise 2: Text-Based Anomaly Detection & Duplicate Detection

Erkennung auffälliger Buchungstexte mittels Levenshtein-Distanz und Häufigkeitsanalyse, sowie Multi-Signal Duplicate Booking Detection mit gewichtetem Scoring über 9 Kriterien (Betrag, Vendor, Konto, Gegenkonto, Datum, Buchungstext, Belegart, Kostenstelle, Steuercode). Automatisch generierte Buchungsregeln aus den bestehenden Transaktionsdaten. Details siehe [docs/exercise-2.md](docs/exercise-2.md).

## Exercise 3: Context Engineering

Architektur-Sketch für kontextbasierte Erklärbarkeit: Nicht nur Zahlen zeigen, sondern Fragen wie "Warum wurde dieser Rabatt gewährt?" oder "Warum ist diese Kennzahl so berechnet?" beantworten. Zwei-Stufen-Retrieval (deterministischer Lookup + semantische Suche), Evidence-first Ansatz. Details siehe [docs/context-engineering.md](docs/context-engineering.md).
