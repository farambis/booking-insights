import type { JournalEntryLine } from "@/lib/data/journal-entry.types";
import type { BookingManual, BookingRule, RuleEvidence } from "./rule.types";
import { GL_ACCOUNTS, ACCOUNT_RANGES } from "@/lib/data/account-master";
import { normalizeForComparison } from "./text-anomaly-detector";

/** Minimum lines per group to emit tax code / cost center rules */
const MIN_LINES_DOMINANT = 5;

/** Minimum concentration for tax code / cost center rules */
const MIN_CONCENTRATION_DOMINANT = 0.8;

/** Minimum concentration for document type -> account range rules (debit side only) */
const MIN_CONCENTRATION_DOC_TYPE = 0.6;

/** Minimum distinct months for recurring text rules */
const MIN_DISTINCT_MONTHS = 2;

/** Minimum concentration for recurring text -> account rules */
const MIN_CONCENTRATION_RECURRING = 0.8;

/** Minimum lines for amount range rules */
const MIN_LINES_AMOUNT = 10;

/** Maximum coefficient of variation for amount range rules */
const MAX_CV_AMOUNT = 1.5;

/** Minimum confidence (after sample-size adjustment) to include a rule */
const MIN_CONFIDENCE = 0.25;

/** Maximum number of rules in the final manual */
const MAX_RULES = 10;

/** Maximum evidence examples per rule */
const MAX_EVIDENCE = 3;

/**
 * Adjust raw concentration by sample size.
 * Small samples get penalized — a 100% concentration on 5 lines
 * is less confident than 95% on 50 lines.
 */
function adjustedConfidence(concentration: number, sampleSize: number): number {
  // Penalize small samples: full confidence at 30+ lines, scaled below that
  const sizeFactor = Math.min(1, Math.sqrt(sampleSize / 30));
  return concentration * sizeFactor;
}

function lookupAccountName(glAccount: string): string | null {
  return GL_ACCOUNTS.find((a) => a.number === glAccount)?.name ?? null;
}

function lookupAccountRange(glAccount: string): string | null {
  const range = ACCOUNT_RANGES.find(
    (r) => glAccount >= r.from && glAccount <= r.to,
  );
  return range?.category ?? null;
}

function buildEvidence(
  lines: JournalEntryLine[],
  note: string,
): RuleEvidence[] {
  return lines.slice(0, MAX_EVIDENCE).map((l) => ({
    documentId: l.document_id,
    postingDate: l.posting_date,
    bookingText: l.booking_text,
    glAccount: l.gl_account,
    glAccountName: lookupAccountName(l.gl_account),
    amount: l.amount,
    note,
  }));
}

export function mineAccountTaxCodeRules(
  lines: JournalEntryLine[],
): BookingRule[] {
  const rules: BookingRule[] = [];

  // Group by gl_account, only lines with non-null tax_code
  const byAccount = new Map<string, JournalEntryLine[]>();
  for (const line of lines) {
    if (line.tax_code === null) continue;
    const group = byAccount.get(line.gl_account) ?? [];
    group.push(line);
    byAccount.set(line.gl_account, group);
  }

  for (const [account, accountLines] of byAccount) {
    if (accountLines.length < MIN_LINES_DOMINANT) continue;

    // Count tax codes
    const taxCounts = new Map<string, number>();
    for (const line of accountLines) {
      const tc = line.tax_code!;
      taxCounts.set(tc, (taxCounts.get(tc) ?? 0) + 1);
    }

    // Find dominant tax code
    let dominantCode = "";
    let dominantCount = 0;
    for (const [code, count] of taxCounts) {
      if (count > dominantCount) {
        dominantCode = code;
        dominantCount = count;
      }
    }

    const concentration = dominantCount / accountLines.length;
    if (concentration < MIN_CONCENTRATION_DOMINANT) continue;

    const accountName = lookupAccountName(account);
    const nameLabel = accountName ? ` (${accountName})` : "";
    const violationCount = accountLines.length - dominantCount;

    rules.push({
      id: "",
      title: `Account ${account}${nameLabel} uses tax code ${dominantCode}`,
      description: `${dominantCount} of ${accountLines.length} bookings (${Math.round(concentration * 100)}%) on account ${account} use tax code ${dominantCode}.`,
      category: "account_tax_code",
      confidence: adjustedConfidence(concentration, accountLines.length),
      supportCount: dominantCount,
      totalEvaluated: accountLines.length,
      supportRatio: concentration,
      evidence: buildEvidence(
        accountLines.filter((l) => l.tax_code === dominantCode),
        `Tax code: ${dominantCode}`,
      ),
      violationCount,
      scope: { glAccount: account, taxCode: dominantCode },
    });
  }

  return rules;
}

export function mineAccountCostCenterRules(
  lines: JournalEntryLine[],
): BookingRule[] {
  const rules: BookingRule[] = [];

  const byAccount = new Map<string, JournalEntryLine[]>();
  for (const line of lines) {
    if (line.cost_center === null) continue;
    const group = byAccount.get(line.gl_account) ?? [];
    group.push(line);
    byAccount.set(line.gl_account, group);
  }

  for (const [account, accountLines] of byAccount) {
    if (accountLines.length < MIN_LINES_DOMINANT) continue;

    const ccCounts = new Map<string, number>();
    for (const line of accountLines) {
      const cc = line.cost_center!;
      ccCounts.set(cc, (ccCounts.get(cc) ?? 0) + 1);
    }

    let dominantCC = "";
    let dominantCount = 0;
    for (const [cc, count] of ccCounts) {
      if (count > dominantCount) {
        dominantCC = cc;
        dominantCount = count;
      }
    }

    const concentration = dominantCount / accountLines.length;
    if (concentration < MIN_CONCENTRATION_DOMINANT) continue;

    const accountName = lookupAccountName(account);
    const nameLabel = accountName ? ` (${accountName})` : "";
    const violationCount = accountLines.length - dominantCount;

    rules.push({
      id: "",
      title: `Account ${account}${nameLabel} uses cost center ${dominantCC}`,
      description: `${dominantCount} of ${accountLines.length} bookings (${Math.round(concentration * 100)}%) on account ${account} use cost center ${dominantCC}.`,
      category: "account_cost_center",
      confidence: adjustedConfidence(concentration, accountLines.length),
      supportCount: dominantCount,
      totalEvaluated: accountLines.length,
      supportRatio: concentration,
      evidence: buildEvidence(
        accountLines.filter((l) => l.cost_center === dominantCC),
        `Cost center: ${dominantCC}`,
      ),
      violationCount,
      scope: { glAccount: account, costCenter: dominantCC },
    });
  }

  return rules;
}

export function mineDocumentTypeAccountRules(
  lines: JournalEntryLine[],
): BookingRule[] {
  const rules: BookingRule[] = [];

  const byDocType = new Map<string, JournalEntryLine[]>();
  for (const line of lines) {
    const group = byDocType.get(line.document_type) ?? [];
    group.push(line);
    byDocType.set(line.document_type, group);
  }

  for (const [docType, docTypeLines] of byDocType) {
    // Only look at debit lines — the credit side is just the contra entry
    // and always belongs to a different range, diluting concentration
    const debitLines = docTypeLines.filter((l) => l.debit_credit === "S");
    if (debitLines.length < 5) continue;

    // Count debit lines per account range
    const rangeCounts = new Map<string, number>();
    for (const line of debitLines) {
      const range = lookupAccountRange(line.gl_account);
      if (!range) continue;
      rangeCounts.set(range, (rangeCounts.get(range) ?? 0) + 1);
    }

    let dominantRange = "";
    let dominantCount = 0;
    for (const [range, count] of rangeCounts) {
      if (count > dominantCount) {
        dominantRange = range;
        dominantCount = count;
      }
    }

    const classifiedCount = [...rangeCounts.values()].reduce((s, n) => s + n, 0);
    if (classifiedCount === 0) continue;
    const concentration = dominantCount / classifiedCount;
    if (concentration < MIN_CONCENTRATION_DOC_TYPE) continue;

    rules.push({
      id: "",
      title: `Document type ${docType} typically debits ${dominantRange} accounts`,
      description: `${dominantCount} of ${classifiedCount} debit lines (${Math.round(concentration * 100)}%) in document type ${docType} belong to ${dominantRange} accounts.`,
      category: "document_type_account",
      confidence: adjustedConfidence(concentration, classifiedCount),
      supportCount: dominantCount,
      totalEvaluated: classifiedCount,
      supportRatio: concentration,
      evidence: buildEvidence(
        debitLines.filter(
          (l) => lookupAccountRange(l.gl_account) === dominantRange,
        ),
        `Account range: ${dominantRange}`,
      ),
      violationCount: docTypeLines.length - dominantCount,
      scope: { documentType: docType },
    });
  }

  return rules;
}

export function mineRecurringTextRules(
  lines: JournalEntryLine[],
): BookingRule[] {
  const rules: BookingRule[] = [];

  // Group by normalized text
  const byText = new Map<string, JournalEntryLine[]>();
  for (const line of lines) {
    const normalized = normalizeForComparison(line.booking_text);
    const group = byText.get(normalized) ?? [];
    group.push(line);
    byText.set(normalized, group);
  }

  for (const [normalizedText, textLines] of byText) {
    // Count distinct months
    const months = new Set<string>();
    for (const line of textLines) {
      months.add(line.posting_date.slice(0, 7)); // YYYY-MM
    }
    if (months.size < MIN_DISTINCT_MONTHS) continue;

    // Count accounts
    const accountCounts = new Map<string, number>();
    for (const line of textLines) {
      accountCounts.set(
        line.gl_account,
        (accountCounts.get(line.gl_account) ?? 0) + 1,
      );
    }

    let dominantAccount = "";
    let dominantCount = 0;
    for (const [account, count] of accountCounts) {
      if (count > dominantCount) {
        dominantAccount = account;
        dominantCount = count;
      }
    }

    const concentration = dominantCount / textLines.length;
    if (concentration < MIN_CONCENTRATION_RECURRING) continue;

    const accountName = lookupAccountName(dominantAccount);
    const nameLabel = accountName ? ` (${accountName})` : "";

    rules.push({
      id: "",
      title: `${normalizedText} is posted monthly to account ${dominantAccount}${nameLabel}`,
      description: `"${normalizedText}" appears in ${months.size} months, posted to account ${dominantAccount} ${Math.round(concentration * 100)}% of the time.`,
      category: "recurring_text",
      confidence: adjustedConfidence(concentration, textLines.length),
      supportCount: dominantCount,
      totalEvaluated: textLines.length,
      supportRatio: concentration,
      evidence: buildEvidence(
        textLines.filter((l) => l.gl_account === dominantAccount),
        `Recurring: ${normalizedText}`,
      ),
      violationCount: textLines.length - dominantCount,
      scope: { textPattern: normalizedText, glAccount: dominantAccount },
    });
  }

  return rules;
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (base + 1 < sorted.length) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function mineAmountRangeRules(lines: JournalEntryLine[]): BookingRule[] {
  const rules: BookingRule[] = [];

  const byAccount = new Map<string, number[]>();
  for (const line of lines) {
    const amounts = byAccount.get(line.gl_account) ?? [];
    amounts.push(line.amount);
    byAccount.set(line.gl_account, amounts);
  }

  for (const [account, amounts] of byAccount) {
    if (amounts.length < MIN_LINES_AMOUNT) continue;

    const sorted = [...amounts].sort((a, b) => a - b);
    const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    const variance =
      amounts.reduce((s, v) => s + (v - mean) ** 2, 0) / amounts.length;
    const stddev = Math.sqrt(variance);
    const cv = mean === 0 ? Infinity : stddev / mean;

    if (cv > MAX_CV_AMOUNT) continue;

    const q1 = quantile(sorted, 0.25);
    const q3 = quantile(sorted, 0.75);

    const accountName = lookupAccountName(account);
    const nameLabel = accountName ? ` (${accountName})` : "";

    // Count how many values fall within Q1-Q3
    const inRange = amounts.filter((a) => a >= q1 && a <= q3).length;

    rules.push({
      id: "",
      title: `Account ${account}${nameLabel} typically has amounts between ${q1.toFixed(2)} and ${q3.toFixed(2)} EUR`,
      description: `${inRange} of ${amounts.length} bookings (${Math.round((inRange / amounts.length) * 100)}%) on account ${account} fall within the interquartile range.`,
      category: "amount_range",
      confidence: adjustedConfidence(inRange / amounts.length, amounts.length),
      supportCount: inRange,
      totalEvaluated: amounts.length,
      supportRatio: inRange / amounts.length,
      evidence: [],
      violationCount: amounts.length - inRange,
      scope: { glAccount: account, amountMin: q1, amountMax: q3 },
    });
  }

  return rules;
}

function buildStableId(rule: BookingRule): string {
  const parts: string[] = [rule.category];

  if (rule.scope.glAccount) parts.push(rule.scope.glAccount);
  if (rule.scope.taxCode) parts.push(rule.scope.taxCode);
  if (rule.scope.costCenter) parts.push(rule.scope.costCenter);
  if (rule.scope.documentType) parts.push(rule.scope.documentType);
  if (rule.scope.textPattern) parts.push(rule.scope.textPattern);

  return parts.join(":");
}

export function mineBookingRules(lines: JournalEntryLine[]): BookingManual {
  const allRules: BookingRule[] = [
    ...mineAccountTaxCodeRules(lines),
    ...mineAccountCostCenterRules(lines),
    ...mineDocumentTypeAccountRules(lines),
    ...mineRecurringTextRules(lines),
    ...mineAmountRangeRules(lines),
  ];

  // Filter by minimum confidence
  const filtered = allRules.filter((r) => r.confidence >= MIN_CONFIDENCE);

  // Category-balanced selection: pick the best rule from each category first,
  // then fill remaining slots by confidence
  const byCategory = new Map<string, BookingRule[]>();
  for (const rule of filtered) {
    const group = byCategory.get(rule.category) ?? [];
    group.push(rule);
    byCategory.set(rule.category, group);
  }
  for (const group of byCategory.values()) {
    group.sort((a, b) => b.confidence - a.confidence);
  }

  const top: BookingRule[] = [];
  const used = new Set<BookingRule>();

  // Phase 1: best rule from each category (ensures diversity)
  for (const group of byCategory.values()) {
    if (group.length > 0 && top.length < MAX_RULES) {
      top.push(group[0]);
      used.add(group[0]);
    }
  }

  // Phase 2: fill remaining slots by confidence across all categories
  const remaining = filtered
    .filter((r) => !used.has(r))
    .sort((a, b) => b.confidence - a.confidence);
  for (const rule of remaining) {
    if (top.length >= MAX_RULES) break;
    top.push(rule);
  }

  // Final sort by confidence
  top.sort((a, b) => b.confidence - a.confidence);

  // Assign stable IDs
  for (const rule of top) {
    rule.id = buildStableId(rule);
  }

  return {
    rules: top,
    generatedAt: new Date().toISOString(),
    datasetSize: lines.length,
  };
}
