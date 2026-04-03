# Booking Insights

Finanz-Analyse-App auf Basis von Buchungsdaten (Journal Entries) im SAP-Stil. Erkennt Red Flags, Anomalien und potenziell falsche Buchungen.

**Live Demo:** https://booking-insights-farambis-projects.vercel.app

## Buchungsdaten

Die App arbeitet mit generierten SAP FI Journal Entries. Details zum Datenmodell, Generierung und Kontenlogik siehe [src/lib/data/README.md](src/lib/data/README.md).

## Exercise 2: Anomaly Detection & Duplicate Detection

Die App erkennt auffällige Buchungen über mehrere Detektoren, die beim Start einmalig auf alle Journal Entries angewendet werden. Jeder Detektor produziert Flags mit Typ, Severity (critical/warning), Confidence-Score und menschenlesbarer Erklärung.

### Wie das Flagging funktioniert

```
journal-entries.json
        |
        v
  Detektoren (parallel, unabhängig voneinander):
  |-- Text-Anomalien (Tippfehler, ungewoehnliche Text-Konto-Kombis, Text-Duplikate)
  |-- Duplikat-Erkennung (Multi-Signal Scoring ueber 9 Kriterien)
  |-- Pattern-Erkennung (ungewoehnliche Betraege, Rundungszahlen, Muster-Brueche)
  |-- Regel-Verletzungen (abgeleitet aus Buchungsregeln)
        |
        v
  Flags werden pro Beleg zusammengefuehrt + dedupliziert
        |
        v
  BookingService (gecacht, bedient Dashboard + Liste + Detail-Ansicht)
```

**Flag-Typen:**
- `duplicate_booking` — Multi-Signal Duplikat (Betrag + Vendor + Konto + Text + Datum)
- `text_typo` — Tippfehler im Buchungstext (Levenshtein-Distanz)
- `unusual_text_account` — Ungewoehnliche Text-Konto-Kombination
- `text_duplicate_posting` — Text-basiertes Duplikat (gleiche Signatur, kurzer Zeitabstand)
- `unusual_amount` — Betrag weicht stark vom Kontodurchschnitt ab
- `round_number_anomaly` — Verdaechtig runder Betrag
- `pattern_break` — Buchung auf falscher Soll/Haben-Seite
- `missing_counterpart` — Beleg ohne Gegenbuchung
- `rule_violation` — Verletzung einer abgeleiteten Buchungsregel

### PR [#1](https://github.com/farambis/booking-insights/pull/1) — Text-Based Anomaly Detection

Drei Detektoren fuer Buchungstext-Anomalien: Tippfehler via Levenshtein-Distanz, ungewoehnliche Text-Konto-Kombinationen via Haeufigkeitsanalyse, und text-basierte Duplikaterkennung via Dokument-Signaturen.

**Wichtigste Erkenntnis:** 99.8% False-Positive-Rate im Tippfehler-Detektor durch datumsbasierte Buchungstexte ("Ausgangsrechnung 2025-01-15" vs "2025-01-16"). Geloest durch Normalisierung: Datumssuffixe werden vor dem Vergleich entfernt.

### PR [#3](https://github.com/farambis/booking-insights/pull/3) — Multi-Signal Duplicate Booking Detection

Ersetzt die einfache Text-Signatur-Duplikaterkennung durch gewichtetes Scoring ueber 9 Signale (Betrag, Vendor/Customer, Sachkonto, Gegenkonto, Buchungsdatum, Buchungstext, Belegart, Kostenstelle, Steuercode).

**Kern-Entscheidung:** Betrag-Match (≤0.50 EUR Differenz) ist ein Pflicht-Gate. Gleicher Vendor + gleiches Konto ohne gleichen Betrag ist normaler Geschaeftsvorfall, kein Duplikat. Confidence wird als Prozent angezeigt (nicht High/Medium/Low), verwandte Belege werden inline in der Flag-Karte angezeigt.

### Booking Manual / Rule Suggestions

Automatisch abgeleitete Buchungsregeln aus Transaktionsdaten (Konto+Steuercode, Konto+Kostenstelle, Belegart+Kontenbereich, wiederkehrende Texte, Betragsranges). Regelverletzungen werden als eigener Flag-Typ erkannt. Details siehe [docs/exercise-3.md](docs/exercise-3.md).

## Exercise 3: Context Engineering

Architektur-Sketch fuer kontextbasierte Erklaerbarkeit: Nicht nur Zahlen zeigen, sondern Fragen wie "Warum wurde dieser Rabatt gewaehrt?" beantworten. Zwei-Stufen-Retrieval (deterministischer Lookup + semantische Suche), Evidence-first Ansatz. Details siehe [docs/context-engineering.md](docs/context-engineering.md).
