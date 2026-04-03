## Enhanced Duplicate Booking Detection

### Summary

- New multi-signal weighted duplicate detector replacing basic same-account check
- Amount match (≤0.50 EUR) is a required gate — no flag without matching amounts
- 8 additional signals increase confidence when amounts match
- Human-readable explanation per flag listing which criteria matched

### Key Design Decision

Same vendor + same account alone is **not** a duplicate — that's normal business activity. Amount match is the mandatory prerequisite. Other signals (vendor, account, text, date proximity) then determine the confidence level.

### Signals & Weights

| Signal                 | Weight | Match Logic                                      |
| ---------------------- | ------ | ------------------------------------------------ |
| Amount (required gate) | 0.25   | ≤0.50 EUR diff → 1.0, else → 0.0 (pair excluded) |
| Vendor/Customer        | 0.20   | Exact match                                      |
| GL Account             | 0.15   | Exact match                                      |
| Contra Account         | 0.10   | Exact match                                      |
| Posting Date           | 0.10   | 0d → 1.0, decreasing to >5d → 0.0                |
| Booking Text           | 0.10   | Exact/Levenshtein distance                       |
| Document Type          | 0.05   | Match/mismatch                                   |
| Cost Center            | 0.03   | Match                                            |
| Tax Code               | 0.02   | Match                                            |

### Gate Rules

- **Amount match required** — no flag without ≤0.50 EUR difference
- Invoice+Payment pairs (KR+KZ, DR+DZ) excluded
- Same document excluded

### Confidence Tiers

- ≥0.75 → Critical
- 0.35–0.74 → Warning
- <0.35 → Not flagged

### Test plan

- [x] Each signal tested individually (10 tests)
- [x] Gate rules tested: amount required, KR+KZ exclusion, same-doc (4 tests)
- [x] Confidence tiers verified (3 tests)
- [x] Explanation text generation (4 tests)
- [x] Edge cases: empty input, single doc, different amounts with same vendor (5 tests)
- [x] Integration test with realistic SAP data (1 test)
- [x] All 264 tests pass, all hooks green
