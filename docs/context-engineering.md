# Context Engineering — Architecture Sketch

**Goal:** When a flag fires or a KPI is displayed, the user should be able to ask "Why?" and get a traceable, source-backed answer — not just a number.

---

## 1. Context Sources

### Tier 1 — Static, immediately integrable (no external system required)

**Chart of Accounts / Data Dictionary**

- Provides: GL account definitions, tax code meanings, document type semantics, cost center descriptions
- Already partially exists in `account-master.ts` (27 accounts, 5 cost centers, 6 document types)
- Extension: Each account gets a `description` field explaining its purpose, typical amount ranges, and expected contra accounts
- Ingestion: Static JSON/TypeScript, version-controlled in the repo
- Example answer: "Account 070500 (Travel Expenses) is used for business travel and related expenses. Typical range: 50–5,000 EUR. Common contra account: 090000 (Bank)."

**Booking Policies & SOPs (Standard Operating Procedures)**

- Provides: Thresholds ("approval required above 5,000 EUR"), process rules ("travel expenses must be approved by cost center manager"), discount policies
- Format: Markdown documents in the repo (e.g., `docs/policies/`)
- Ingestion: Chunk and embed at deploy time. Each chunk gets a version stamp
- Example answer: "Per travel expense policy §3.2, individual receipts above 500 EUR require separate approval. [Source: travel-expense-policy.md, v2.1, effective 01.01.2025]"

### Tier 2 — On-demand, requires API integration

**Approval Workflows / Approval History**

- Provides: Who approved the document, when, under which delegation rule
- Source: SAP BAPI/oData or internal workflow system
- Ingestion: Fetched per document on-demand when the user opens the detail view, cached for 24h
- Example answer: "Document 5000000142 was approved on 15.02.2025 by M. Schmidt (substituting for F. Weber, vacation rule)."

**CRM Notes**

- Provides: Business context for customers/vendors ("Mueller GmbH switched bank accounts in Q3", "special discount agreed for first order")
- Source: CRM API (Salesforce, HubSpot, etc.)
- Ingestion: On-demand per `vendor_id` / `customer_id` when a flag with vendor/customer reference is inspected
- Example answer: "CRM note for V0003 (Mueller GmbH): '10% special discount agreed for orders above 10,000 EUR, valid until 31.03.2025.' [Created by T. Bauer, 12.01.2025]"

### Tier 3 — Async, highest integration cost

**Email / Correspondence**

- Provides: Invoice disputes, correction requests, informal agreements
- Source: Exchange/Graph API, matched by document number or vendor ID in subject/body
- Ingestion: Async index, not real-time. Periodic crawl (e.g., daily) with matching heuristics
- Risk: Data privacy (email contents are sensitive), requires clear access rules
- Example answer: "Email from mueller@muellerGmbH.de on 14.02.2025: 'Please correct invoice 2025-412, the amount should be 1,404.17 EUR instead of 1,500.00 EUR.'"

**Prioritization:** Start with Tier 1 (zero integration risk, immediate value). Add Tier 2 when the UI is validated. Tier 3 only if explicit demand exists.

---

## 2. Entity/Relation Model

```
JournalEntryLine (existing)
  |
  |-- documentId, glAccount, vendorId, customerId, costCenter, taxCode
  |
  +---> BookingFlag (existing)
  |       |-- type, severity, explanation, confidence
  |       |
  |       +---> ContextEvidence[] (NEW, lazy-loaded)
  |               |-- sourceType: "dictionary" | "policy" | "approval" | "crm" | "email"
  |               |-- sourceRef: string         // URI or file path to source document
  |               |-- excerpt: string           // The relevant text excerpt
  |               |-- relevanceScore: number    // 0-1, how well the evidence matches the flag
  |               |-- retrievedAt: string       // ISO date, when retrieved
  |
  +---> KpiDefinition (NEW, static registry for dashboard)
          |-- kpiId: string                     // e.g., "total_documents", "critical_count"
          |-- label: string                     // "Critical Flags"
          |-- formula: string                   // Human-readable calculation formula
          |-- owner: string                     // Team or role responsible
          |-- derivedFrom: string[]             // Which GL accounts / flag types feed into it
          |-- policyRef: string | null          // Link to governing policy
          |-- description: string               // Why this KPI exists and what it measures
```

### Key Relationships

- **BookingFlag → ContextEvidence[]**: Each flag can have 0-N evidence entries. Evidence is loaded **lazily** (only when the user opens the detail view), not during batch flagging. This keeps startup time short.
- **KpiDefinition → GL accounts / flag types**: The dashboard reads the KPI registry to render "Why is this KPI calculated this way?" tooltips. Purely static, no API call.
- **ContextEvidence → Source document**: Each evidence entry links to the original document (policy, CRM note, email). The user can always navigate to the primary source.

### How Bookings Link to Business Context

```
Booking (5000000142)
  |
  |-- glAccount: "070000" --> Dictionary: "Rent — monthly office rent"
  |-- vendorId: "V0003"  --> CRM: "Mueller GmbH, special discount agreed"
  |-- costCenter: "3000"  --> Dictionary: "Production — cost center manager: M. Schmidt"
  |-- taxCode: "V19"      --> Dictionary: "Input VAT 19%, standard rate"
  |
  +-- Flag: duplicate_booking (87%)
        |
        +-- Evidence[0]: Dictionary "Account 070000 is used for rent, same monthly amount expected"
        +-- Evidence[1]: Policy "§2.1: Duplicate bookings must be reversed within 5 business days"
        +-- Evidence[2]: CRM "Rental contract V0003: 1,404.17 EUR/month since 01.01.2025"
```

---

## 3. Retrieval Strategy

### Two-tier architecture (not a single RAG pipeline)

**Tier 1 — Deterministic lookup (covers ~60% of "Why?" questions)**

Direct key-value lookups with zero hallucination risk:

| Question | Lookup | Source |
|----------|--------|--------|
| "What is account 070000?" | `glAccount → definition` | Data Dictionary |
| "What does tax code V19 mean?" | `taxCode → description` | Data Dictionary |
| "What is document type KR?" | `docType → description` | Data Dictionary |
| "Who is responsible for cost center 3000?" | `costCenter → owner` | Data Dictionary |
| "How is 'Critical Flags' calculated?" | `kpiId → formula + derivedFrom` | KPI Registry |

Implementation: Simple maps loaded at startup — same pattern as the existing `account-master.ts`. Zero latency, zero error risk.

**Tier 2 — Semantic search for policies/SOPs**

For questions that cannot be answered by a simple lookup:

1. **Chunking:** Split policy documents into paragraphs/sections (~200-500 tokens per chunk). Each chunk retains metadata (document title, section number, version, effective date).

2. **Embedding:** Embed chunks with a lightweight model (e.g., `text-embedding-3-small`). Stored in a vector index:
   - **MVP:** In-memory HNSW (sufficient for <1000 chunks, no external service needed)
   - **Later:** pgvector when a database is added

3. **Query construction:** The query is built from the flag context:
   ```
   "{bookingText} {glAccountName} {flagType} {flagExplanation}"
   ```
   Example: "Lieferant Mueller GmbH Miete duplicate_booking same amount same vendor"

4. **Ranking:** Return top-3 chunks. Only display chunks with similarity score ≥ 0.78. Tier 1 results always rank above Tier 2 (deterministic beats probabilistic).

### Evidence-first display (no black-box answering)

- **Never** show a generated summary without the source excerpt
- Each `ContextEvidence` is rendered as a collapsible card: source type icon, excerpt, link to full document
- The **user** judges relevance, not the system
- No LLM in the critical path in v1 — pure retrieval + display

### Future phase: LLM synthesizer

Once Tier 1 + Tier 2 are stable, an LLM summarizer can synthesize evidence into a narrative answer:

> "This document was flagged as a possible duplicate (87% confidence). The rental contract with Mueller GmbH (V0003) specifies 1,404.17 EUR/month (CRM note). Per policy §2.1, duplicate bookings must be reversed within 5 business days."

But: The evidence cards **always** remain visible alongside the summary. The user must be able to verify the sources.

---

## 4. Risks + Mitigations

### Risk 1: Stale policies lead to incorrect explanations

**Problem:** SOPs change. If the embedded corpus is outdated, the system confidently cites a superseded rule. An accountant relying on an old policy makes incorrect decisions.

**Mitigation:**
- **Version stamps:** Each policy chunk gets a version hash and date at embed time. The evidence card shows: `[v2.1, effective since 01.01.2025]`
- **Deploy-time drift check:** At build time, check if policy files have changed since the last embedding. If drift > 30 days without re-embedding → build warning (not blocking, but visible)
- **Expiry dates:** Policies can have a `valid_until` field. Expired chunks are marked in the UI with "Possibly outdated"
- **Organizational:** Policy owners are named in the KPI registry → clear point of contact when something is outdated

### Risk 2: Semantic search returns plausible but irrelevant context (false grounding)

**Problem:** A policy about "travel expense reimbursement above 5,000 EUR" could surface for a flag on a vendor invoice simply because both mention "5,000 EUR". The user trusts the system and acts based on an irrelevant policy.

**Mitigation:**
- **Similarity threshold:** Minimum score of 0.78. Below that, nothing is displayed — better no evidence than wrong evidence
- **Tier 1 priority:** If the deterministic lookup has a hit (e.g., account definition), it always ranks above semantic results. Deterministic beats probabilistic
- **Context scoping:** Semantic search is restricted to relevant policy categories (e.g., a flag on "travel expenses" only searches the travel expense policy, not the entire corpus). Implemented via metadata filters on chunks
- **Retrieval monitoring:** Log queries and scores. Monthly review of bottom-quartile matches to tune thresholds
- **Transparency:** Each evidence card shows the relevance score. Users can see at a glance whether a result is 0.95 (very relevant) or 0.79 (barely above threshold)

---

## 5. Integration into Existing Architecture

### Where it fits

```
Existing system:                       Context Engineering Layer:

BookingService                         ContextService (NEW)
  getDashboardSummary()                  getEvidence(flagId) → ContextEvidence[]
  getBookings(filters)                   getKpiDefinition(kpiId) → KpiDefinition
  getBookingDetail(docId)                getDictionaryEntry(key) → DictionaryEntry
  getRelatedContext(docId)
```

- `ContextService` is a **separate interface** alongside `BookingService`, not embedded within it
- Evidence is loaded **lazily**: the detail page calls `getEvidence()` only when it renders
- Batch flagging (`flag-engine`, `duplicate-detector`) remains unchanged — Context Engineering is a read-path feature, not a write-path feature

### Implementation order

1. **Extend Data Dictionary** — Add descriptions, typical ranges, contra accounts to `account-master.ts`. KPI registry as a static TypeScript module. → Tier 1 lookups work
2. **Build evidence UI** — `ContextEvidence` cards in the detail view. Collapsible, with source type icon and link
3. **Create policy documents** — 3-5 example policies as Markdown. Chunking + embedding pipeline
4. **Semantic search** — In-memory vector index, query builder, ranking with Tier 1 priority
5. **Live sources** — Approval workflows, CRM (Tier 2) only after the UI is validated
