# Context Engineering — Architecture Sketch

**Goal:** When a flag fires or a KPI is displayed, the user can ask "Why?" and get a traceable, source-backed answer — not just a number.

## Context Sources (prioritized by integration risk)

| Tier | Source | What it provides | When to add |
|------|--------|-----------------|-------------|
| 1 | Data Dictionary | GL account definitions, tax codes, document types, cost centers | Now (partially exists in `account-master.ts`) |
| 1 | Policies & SOPs | Thresholds, approval rules, discount policies (Markdown in repo) | Now |
| 2 | Approval Workflows | Who approved what, when, under which delegation | When UI is validated |
| 2 | CRM Notes | Vendor/customer context (discounts, bank changes) | When UI is validated |
| 3 | Email | Invoice disputes, correction requests | Only if explicit demand |

## Retrieval: Two Tiers

**Tier 1 — Deterministic lookup (~60% of questions).** Direct key-value maps (account → definition, tax code → description, KPI → formula). Same pattern as `account-master.ts`. Zero hallucination risk, zero latency.

**Tier 2 — Semantic search for policies.** Chunk policy docs, embed with `text-embedding-3-small`, store in in-memory HNSW index. Query built from flag context. Minimum similarity threshold 0.78. Tier 1 always ranks above Tier 2.

**Evidence-first:** Always show source excerpts, never a black-box answer. No LLM in v1 — pure retrieval. Future LLM synthesizer optional, but evidence cards always remain visible.

## Data Model

```
BookingFlag (existing)
  +---> ContextEvidence[] (NEW, lazy-loaded on detail page)
          |-- sourceType: "dictionary" | "policy" | "approval" | "crm" | "email"
          |-- excerpt: string
          |-- sourceRef: string (URI to source document)
          |-- relevanceScore: number (0-1)

KpiDefinition (NEW, static registry)
  |-- kpiId, label, formula, owner, derivedFrom, policyRef
```

Evidence is fetched lazily (not during batch flagging). `ContextService` is a separate interface alongside `BookingService`.

## Risks

**Stale policies** — Mitigated by version stamps on chunks, deploy-time drift checks (warn if >30 days without re-embedding), and `valid_until` expiry dates.

**False grounding** — Mitigated by similarity threshold (0.78), Tier 1 priority over Tier 2, context scoping via metadata filters, and showing relevance scores to users.
