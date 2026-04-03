# Context Engineering — Architecture Sketch

**Ziel:** Wenn ein Flag feuert oder ein KPI angezeigt wird, soll der User "Warum?" fragen können und eine nachvollziehbare, quellenbelegte Antwort bekommen — nicht nur eine Zahl.

---

## 1. Kontextquellen

### Tier 1 — Statisch, sofort integrierbar (kein externes System nötig)

**Kontenrahmen / Data Dictionary**

- Was es liefert: GL-Konto-Definitionen, Steuercode-Bedeutungen, Belegarten-Semantik, Kostenstellen-Beschreibungen
- Existiert bereits teilweise in `account-master.ts` (27 Konten, 5 Kostenstellen, 6 Belegarten)
- Erweiterung: Jedes Konto bekommt ein `description`-Feld mit Erklärung wofür es verwendet wird, typische Betragsranges, und erwartete Gegenkonten
- Ingestion: Statisches JSON/TypeScript, versioniert im Repo
- Beispiel-Antwort: "Konto 070500 (Reisekosten) wird für Dienstreisen und damit verbundene Auslagen verwendet. Typischer Bereich: 50–5.000 EUR. Übliches Gegenkonto: 090000 (Bank)."

**Buchungsrichtlinien & SOPs (Standard Operating Procedures)**

- Was es liefert: Schwellenwerte ("Freigabe ab 5.000 EUR nötig"), Prozessregeln ("Reisekosten müssen vom Kostenstellenleiter genehmigt werden"), Rabattrichtlinien
- Format: Markdown-Dokumente im Repo (z.B. `docs/policies/`)
- Ingestion: Bei Deploy chunken und embedden. Jedes Chunk bekommt einen Versions-Stempel
- Beispiel-Antwort: "Laut Reisekostenrichtlinie §3.2 sind Einzelbelege über 500 EUR gesondert zu genehmigen. [Quelle: reisekosten-richtlinie.md, v2.1, gültig seit 01.01.2025]"

### Tier 2 — On-Demand, erfordert API-Anbindung

**Freigabe-Workflows / Approval History**

- Was es liefert: Wer hat den Beleg freigegeben, wann, unter welcher Vertretungsregelung
- Quelle: SAP BAPI/oData oder internes Workflow-System
- Ingestion: Pro Beleg on-demand abrufen wenn der User die Detail-Ansicht öffnet, 24h gecacht
- Beispiel-Antwort: "Beleg 5000000142 wurde am 15.02.2025 von M. Schmidt freigegeben (Vertretung für F. Weber, Urlaubsregelung)."

**CRM-Notizen**

- Was es liefert: Geschäftskontext zu Kunden/Lieferanten ("Müller GmbH hat in Q3 die Bankverbindung gewechselt", "Sonderrabatt vereinbart für Erstbestellung")
- Quelle: CRM API (Salesforce, HubSpot, o.ä.)
- Ingestion: On-demand per `vendor_id` / `customer_id` wenn ein Flag mit Vendor/Customer-Bezug inspiziert wird
- Beispiel-Antwort: "CRM-Notiz zu V0003 (Müller GmbH): '10% Sonderrabatt vereinbart für Bestellungen über 10.000 EUR, gültig bis 31.03.2025.' [Erstellt von T. Bauer, 12.01.2025]"

### Tier 3 — Async, höchste Integrationskosten

**E-Mail / Korrespondenz**

- Was es liefert: Rechnungsdispute, Korrekturanfragen, informelle Absprachen
- Quelle: Exchange/Graph API, gematcht über Belegnummer oder Vendor-ID im Betreff/Body
- Ingestion: Async-Index, nicht real-time. Periodischer Crawl (z.B. täglich) mit Matching-Heuristik
- Risiko: Datenschutz (E-Mail-Inhalte sind sensibel), erfordert klare Zugriffsregeln
- Beispiel-Antwort: "E-Mail von mueller@muellerGmbH.de am 14.02.2025: 'Bitte korrigieren Sie die Rechnung 2025-412, der Betrag sollte 1.404,17 EUR statt 1.500,00 EUR sein.'"

**Priorisierung:** Mit Tier 1 starten (null Integrationsrisiko, sofortiger Mehrwert). Tier 2 hinzufügen wenn die UI steht. Tier 3 nur wenn expliziter Bedarf besteht.

---

## 2. Entity/Relation-Modell

```
JournalEntryLine (existiert)
  |
  |-- documentId, glAccount, vendorId, customerId, costCenter, taxCode
  |
  +---> BookingFlag (existiert)
  |       |-- type, severity, explanation, confidence
  |       |
  |       +---> ContextEvidence[] (NEU, lazy-loaded)
  |               |-- sourceType: "dictionary" | "policy" | "approval" | "crm" | "email"
  |               |-- sourceRef: string         // URI oder Dateipfad zum Quelldokument
  |               |-- excerpt: string           // Der relevante Textauszug
  |               |-- relevanceScore: number    // 0-1, wie gut passt die Evidenz zum Flag
  |               |-- retrievedAt: string       // ISO-Datum, wann abgerufen
  |
  +---> KpiDefinition (NEU, statisches Registry für Dashboard)
          |-- kpiId: string                     // z.B. "total_documents", "critical_count"
          |-- label: string                     // "Kritische Flags"
          |-- formula: string                   // Menschenlesbare Berechnungsformel
          |-- owner: string                     // Team oder Rolle die den KPI verantwortet
          |-- derivedFrom: string[]             // Welche GL-Konten / Flag-Typen einfließen
          |-- policyRef: string | null          // Link zur Richtlinie die diesen KPI definiert
          |-- description: string               // Warum dieser KPI existiert und was er aussagt
```

### Schlüssel-Beziehungen

- **BookingFlag → ContextEvidence[]**: Jedes Flag kann 0-N Evidenz-Einträge haben. Evidenz wird **lazy** geladen (erst wenn der User die Detail-Ansicht öffnet), nicht während des Batch-Flaggings. Das hält die Startup-Zeit kurz.
- **KpiDefinition → GL-Konten / Flag-Typen**: Das Dashboard liest das KPI-Registry um "Warum wird dieser KPI so berechnet?" Tooltips zu rendern. Rein statisch, kein API-Call.
- **ContextEvidence → Quelldokument**: Jede Evidenz verlinkt auf das Originaldokument (Richtlinie, CRM-Notiz, E-Mail). Der User kann immer zur Primärquelle navigieren.

### Wie Buchungen zum Geschäftskontext verlinkt werden

```
Buchung (5000000142)
  |
  |-- glAccount: "070000" ──→ Dictionary: "Miete — monatliche Büromiete"
  |-- vendorId: "V0003"  ──→ CRM: "Müller GmbH, Sonderrabatt vereinbart"
  |-- costCenter: "3000"  ──→ Dictionary: "Production — Kostenstellenleiter: M. Schmidt"
  |-- taxCode: "V19"      ──→ Dictionary: "Vorsteuer 19%, Standard-USt"
  |
  +-- Flag: duplicate_booking (87%)
        |
        +-- Evidence[0]: Dictionary "Konto 070000 wird für Miete verwendet, monatlich gleicher Betrag erwartet"
        +-- Evidence[1]: Policy "§2.1: Doppelbuchungen müssen innerhalb von 5 Werktagen storniert werden"
        +-- Evidence[2]: CRM "Mietvertrag V0003: 1.404,17 EUR/Monat seit 01.01.2025"
```

---

## 3. Retrieval-Strategie

### Zwei-Stufen-Architektur (nicht eine einzelne RAG-Pipeline)

**Tier 1 — Deterministischer Lookup (deckt ~60% der "Warum?"-Fragen ab)**

Direkte Key-Value Lookups ohne jegliches Halluzinationsrisiko:

| Frage                                   | Lookup                          | Quelle          |
| --------------------------------------- | ------------------------------- | --------------- |
| "Was ist Konto 070000?"                 | `glAccount → definition`        | Data Dictionary |
| "Was bedeutet Steuercode V19?"          | `taxCode → description`         | Data Dictionary |
| "Was ist Belegart KR?"                  | `docType → description`         | Data Dictionary |
| "Wer verantwortet Kostenstelle 3000?"   | `costCenter → owner`            | Data Dictionary |
| "Wie wird 'Kritische Flags' berechnet?" | `kpiId → formula + derivedFrom` | KPI Registry    |

Implementation: Einfache Maps die beim Startup geladen werden — gleiches Pattern wie das existierende `account-master.ts`. Null Latenz, null Fehlerrisiko.

**Tier 2 — Semantische Suche für Richtlinien/SOPs**

Für Fragen die nicht durch einen einfachen Lookup beantwortet werden können:

1. **Chunking:** Policy-Dokumente in Absätze/Abschnitte zerteilen (~200-500 Tokens pro Chunk). Jeder Chunk behält Metadaten (Dokumenttitel, Abschnittsnummer, Version, Gültigkeitsdatum).

2. **Embedding:** Chunks mit einem leichtgewichtigen Modell embedden (z.B. `text-embedding-3-small`). Gespeichert in einem Vector-Index:
   - **MVP:** In-Memory HNSW (reicht für <1000 Chunks, kein externer Service nötig)
   - **Später:** pgvector wenn eine Datenbank hinzukommt

3. **Query-Konstruktion:** Der Query wird aus dem Flag-Kontext gebaut:

   ```
   "{bookingText} {glAccountName} {flagType} {flagExplanation}"
   ```

   Beispiel: "Lieferant Müller GmbH Miete duplicate_booking same amount same vendor"

4. **Ranking:** Top-3 Chunks zurückgeben. Nur Chunks mit Similarity-Score ≥ 0.78 anzeigen. Tier-1-Ergebnisse werden immer über Tier-2 gerankt (deterministische Ergebnisse haben Vorrang).

### Evidence-First Display (kein Black-Box-Answering)

- **Nie** eine generierte Zusammenfassung ohne Quellauszug anzeigen
- Jede `ContextEvidence` wird als aufklappbare Karte gerendert: Quelltyp-Icon, Auszug, Link zum Volldokument
- Der **User** beurteilt die Relevanz, nicht das System
- Kein LLM im kritischen Pfad in v1 — reines Retrieval + Anzeige

### Spätere Phase: LLM-Synthesizer

Wenn Tier 1 + Tier 2 stabil laufen, kann ein LLM-Summarizer die Evidenz zu einer narrativen Antwort zusammenfassen:

> "Dieser Beleg wurde als mögliches Duplikat erkannt (87% Confidence). Der Mietvertrag mit Müller GmbH (V0003) sieht 1.404,17 EUR/Monat vor (CRM-Notiz). Laut Richtlinie §2.1 müssen Doppelbuchungen innerhalb von 5 Werktagen storniert werden."

Aber: Die Evidenz-Karten bleiben **immer** sichtbar neben der Zusammenfassung. Der User muss die Quellen prüfen können.

---

## 4. Risiken + Mitigations

### Risiko 1: Veraltete Richtlinien führen zu falschen Erklärungen

**Problem:** SOPs ändern sich. Wenn der eingebettete Corpus veraltet ist, zitiert das System selbstbewusst eine überholte Regel. Ein Buchhalter der sich auf eine alte Richtlinie verlässt, trifft falsche Entscheidungen.

**Mitigation:**

- **Versions-Stempel:** Jeder Policy-Chunk bekommt beim Embedden einen Versions-Hash und ein Datum. Die Evidence-Karte zeigt: `[v2.1, gültig seit 01.01.2025]`
- **Deploy-Time Drift-Check:** Beim Build prüfen ob Policy-Dateien sich seit dem letzten Embedding geändert haben. Wenn Drift > 30 Tage ohne Re-Embedding → Build-Warning (nicht Block, aber sichtbar)
- **Ablaufdatum:** Policies können ein `valid_until` Feld haben. Abgelaufene Chunks werden im UI mit ⚠️ "Möglicherweise veraltet" markiert
- **Organisatorisch:** Policy-Owners werden im KPI-Registry benannt → klarer Ansprechpartner wenn etwas veraltet ist

### Risiko 2: Semantische Suche liefert plausiblen aber irrelevanten Kontext (False Grounding)

**Problem:** Eine Richtlinie über "Reisekostenabrechnung ab 5.000 EUR" könnte für ein Flag auf einer Lieferantenrechnung auftauchen, einfach weil beide "5.000 EUR" erwähnen. Der User vertraut dem System und handelt auf Basis einer irrelevanten Richtlinie.

**Mitigation:**

- **Similarity-Threshold:** Mindest-Score von 0.78. Darunter wird nichts angezeigt — lieber keine Evidenz als falsche
- **Tier-1-Vorrang:** Wenn der deterministische Lookup einen Treffer hat (z.B. Kontodefinition), wird er immer über semantische Ergebnisse gerankt. Deterministisch schlägt probabilistisch
- **Kontext-Eingrenzung:** Semantic Search wird auf relevante Policy-Kategorien eingeschränkt (z.B. ein Flag auf "Reisekosten" sucht nur in der Reisekostenrichtlinie, nicht im gesamten Corpus). Implementiert über Metadaten-Filter auf den Chunks
- **Retrieval-Monitoring:** Queries und Scores loggen. Monatlich die Bottom-Quartile-Matches reviewen und Thresholds anpassen
- **Transparenz:** Jede Evidence-Karte zeigt den Relevance-Score. User können auf einen Blick sehen ob ein Ergebnis 0.95 (sehr relevant) oder 0.79 (gerade so über Threshold) ist

---

## 5. Integration in die bestehende Architektur

### Wo es reinpasst

```
Bestehendes System:                    Context Engineering Layer:

BookingService                         ContextService (NEU)
  getDashboardSummary()                  getEvidence(flagId) → ContextEvidence[]
  getBookings(filters)                   getKpiDefinition(kpiId) → KpiDefinition
  getBookingDetail(docId)                getDictionaryEntry(key) → DictionaryEntry
  getRelatedContext(docId)
```

- `ContextService` ist ein **separates Interface** neben `BookingService`, nicht eingebettet darin
- Evidence wird **lazy** geladen: die Detail-Seite ruft `getEvidence()` erst auf wenn sie rendert
- Das Batch-Flagging (`flag-engine`, `duplicate-detector`) bleibt unverändert — Context Engineering ist ein Read-Path-Feature, kein Write-Path-Feature

### Implementierungs-Reihenfolge

1. **Data Dictionary erweitern** — `account-master.ts` um Beschreibungen, typische Ranges, Gegenkonten erweitern. KPI-Registry als statisches TypeScript-Modul. → Tier-1 Lookups funktionieren
2. **Evidence-UI bauen** — `ContextEvidence`-Karten in der Detail-Ansicht. Aufklappbar, mit Quelltyp-Icon und Link
3. **Policy-Dokumente anlegen** — 3-5 Beispiel-Richtlinien als Markdown. Chunking + Embedding Pipeline
4. **Semantic Search** — In-Memory Vector Index, Query-Builder, Ranking mit Tier-1-Vorrang
5. **Live-Quellen** — Approval-Workflows, CRM (Tier 2) erst wenn die UI validiert ist
