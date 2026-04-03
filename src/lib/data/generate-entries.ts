import { GL_ACCOUNTS, COST_CENTERS, type GlAccount } from "./account-master";
import type { JournalEntryLine } from "./journal-entry.types";

/**
 * Mulberry32 seeded PRNG. Returns a function that produces
 * deterministic pseudo-random numbers in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick a random element from an array using the PRNG. */
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Pick a random integer in [min, max] inclusive. */
function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Round to 2 decimal places. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// -- Weighted account selection --
// Expense and bank accounts appear more often than asset accounts.
interface WeightedAccount {
  account: GlAccount;
  weight: number;
}

function buildWeightedAccounts(): WeightedAccount[] {
  const categoryWeights: Record<string, number> = {
    Assets: 1,
    Receivables: 3,
    Liabilities: 3,
    Revenue: 5,
    "Cost of goods sold": 4,
    "Personnel expenses": 4,
    "Operating expenses": 8,
    "Tax & other": 1,
    "Bank & cash": 6,
  };
  return GL_ACCOUNTS.map((account) => ({
    account,
    weight: categoryWeights[account.category] ?? 1,
  }));
}

function pickWeighted(rng: () => number, items: WeightedAccount[]): GlAccount {
  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  let r = rng() * totalWeight;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.account;
  }
  return items[items.length - 1].account;
}

// -- Booking text templates --
const VENDOR_TEXTS = [
  "Lieferant Müller GmbH",
  "Lieferant Schmidt AG",
  "Lieferant Weber KG",
  "Lieferant Fischer OHG",
  "Lieferant Becker GmbH",
];

const CUSTOMER_TEXTS_BASE = [
  "Kundenrechnung",
  "Ausgangsrechnung",
  "Verkauf an Kunde",
];

const EXPENSE_TEXTS: Record<string, string[]> = {
  "070000": ["Miete Büro Januar", "Miete Büro Februar"],
  "070100": ["Stromkosten", "Gaskosten", "Heizkosten"],
  "070200": ["Telefonkosten", "Internetkosten"],
  "070300": ["Büromaterial", "Druckerpatronen", "Kopierpapier"],
  "070400": ["Betriebshaftpflicht", "Gebäudeversicherung"],
  "070500": ["Reisekosten Vertrieb", "Reisekosten Messe"],
  "070600": ["Google Ads", "Messebeteiligung", "Werbeflyer"],
  "070700": ["Reparatur Klimaanlage", "Wartung Aufzug"],
  "070800": ["Porto Ausgangspost", "DHL Versandkosten"],
  "070900": ["Steuerberater", "Rechtsanwalt"],
  "071000": ["Abschreibung BGA", "Abschreibung Gebäude"],
  "071100": ["Softwarelizenzen", "Servermiete", "IT-Support"],
};

const GENERIC_TEXTS = [
  "Buchung laut Beleg",
  "Korrektur",
  "Umbuchung",
  "Periodische Abgrenzung",
];

function getBookingText(
  rng: () => number,
  account: GlAccount,
  docType: string,
  month: number,
): string {
  const monthName = month === 1 ? "Januar" : "Februar";

  if (docType === "KR" || docType === "KZ") {
    return pick(rng, VENDOR_TEXTS);
  }
  if (docType === "DR" || docType === "DZ") {
    const base = pick(rng, CUSTOMER_TEXTS_BASE);
    return `${base} 2025-${String(month).padStart(2, "0")}-${String(randInt(rng, 1, 28)).padStart(2, "0")}`;
  }
  if (account.category === "Personnel expenses") {
    const base = account.name.includes("Gehalt") ? "Gehälter" : "Löhne";
    return `${base} ${monthName}`;
  }

  const specific = EXPENSE_TEXTS[account.number];
  if (specific) {
    let text = pick(rng, specific);
    if (text.includes("Januar") || text.includes("Februar")) {
      text = text.replace(/Januar|Februar/, monthName);
    }
    return text;
  }

  return pick(rng, GENERIC_TEXTS);
}

// -- Cost center assignment --
// Expense accounts get cost centers, balance sheet accounts don't.
function assignCostCenter(
  rng: () => number,
  account: GlAccount,
): string | null {
  const expenseCategories = [
    "Operating expenses",
    "Personnel expenses",
    "Cost of goods sold",
  ];
  if (!expenseCategories.includes(account.category)) return null;
  return pick(rng, COST_CENTERS).id;
}

// -- Document type scenarios --
interface DocScenario {
  docType: string;
  debitCategory: string;
  creditCategory: string;
  weight: number;
}

const DOC_SCENARIOS: DocScenario[] = [
  // Vendor invoice: expense debit, liability credit
  {
    docType: "KR",
    debitCategory: "Operating expenses",
    creditCategory: "Liabilities",
    weight: 8,
  },
  // Vendor invoice for goods
  {
    docType: "KR",
    debitCategory: "Cost of goods sold",
    creditCategory: "Liabilities",
    weight: 4,
  },
  // Customer invoice: receivable debit, revenue credit
  {
    docType: "DR",
    debitCategory: "Receivables",
    creditCategory: "Revenue",
    weight: 6,
  },
  // Vendor payment: liability debit, bank credit
  {
    docType: "KZ",
    debitCategory: "Liabilities",
    creditCategory: "Bank & cash",
    weight: 5,
  },
  // Customer payment: bank debit, receivable credit
  {
    docType: "DZ",
    debitCategory: "Bank & cash",
    creditCategory: "Receivables",
    weight: 5,
  },
  // Salary posting: personnel debit, bank credit
  {
    docType: "SA",
    debitCategory: "Personnel expenses",
    creditCategory: "Bank & cash",
    weight: 3,
  },
  // GL posting: various
  {
    docType: "SA",
    debitCategory: "Operating expenses",
    creditCategory: "Bank & cash",
    weight: 4,
  },
  // Tax payment
  {
    docType: "SA",
    debitCategory: "Tax & other",
    creditCategory: "Bank & cash",
    weight: 1,
  },
];

function pickScenario(rng: () => number): DocScenario {
  const totalWeight = DOC_SCENARIOS.reduce((s, sc) => s + sc.weight, 0);
  let r = rng() * totalWeight;
  for (const sc of DOC_SCENARIOS) {
    r -= sc.weight;
    if (r <= 0) return sc;
  }
  return DOC_SCENARIOS[DOC_SCENARIOS.length - 1];
}

function getAccountByCategory(
  rng: () => number,
  category: string,
  weighted: WeightedAccount[],
): GlAccount {
  const matching = weighted.filter((w) => w.account.category === category);
  if (matching.length === 0) {
    // Fallback: just pick any account in that category from GL_ACCOUNTS
    const fallback = GL_ACCOUNTS.filter((a) => a.category === category);
    return pick(rng, fallback);
  }
  return pickWeighted(rng, matching);
}

function getTaxCode(docType: string, account: GlAccount): string | null {
  // Input VAT on vendor invoices for expense/COGS accounts
  if (
    docType === "KR" &&
    ["Operating expenses", "Cost of goods sold"].includes(account.category)
  ) {
    return "V19";
  }
  // Output VAT on customer invoices
  if (docType === "DR" && account.category === "Revenue") {
    return "A19";
  }
  return null;
}

/** Vendor IDs */
const VENDOR_IDS = [
  "V0001",
  "V0002",
  "V0003",
  "V0004",
  "V0005",
  "V0006",
  "V0007",
  "V0008",
];

/** Customer IDs */
const CUSTOMER_IDS = ["C0001", "C0002", "C0003", "C0004", "C0005", "C0006"];

export interface GenerationResult {
  lines: JournalEntryLine[];
  anomalies: string[];
}

export function generateJournalEntries(): GenerationResult {
  const rng = mulberry32(42);
  const weighted = buildWeightedAccounts();
  const anomalies: string[] = [];
  const allLines: JournalEntryLine[] = [];

  // Target ~150-170 documents to get 400-600 lines (avg ~3 lines per doc)
  const docCount = randInt(rng, 150, 170);
  let docNumber = 5000000001;

  // Generate posting dates spread across Jan-Feb 2025
  function randomDate(): string {
    const month = rng() < 0.5 ? 1 : 2;
    const maxDay = month === 1 ? 31 : 28;
    const day = randInt(rng, 1, maxDay);
    return `2025-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  for (let d = 0; d < docCount; d++) {
    const scenario = pickScenario(rng);
    const date = randomDate();
    const month = parseInt(date.split("-")[1], 10);
    const docId = String(docNumber++);

    const debitAccount = getAccountByCategory(
      rng,
      scenario.debitCategory,
      weighted,
    );
    const creditAccount = getAccountByCategory(
      rng,
      scenario.creditCategory,
      weighted,
    );

    // Decide number of extra split lines (0-3, most docs have just 2 lines)
    const extraLines = rng() < 0.3 ? randInt(rng, 1, 3) : 0;
    const totalDebitLines = 1 + extraLines;

    // Generate amounts
    const totalAmount = round2(randInt(rng, 50, 50000) + rng());
    const amounts: number[] = [];

    if (totalDebitLines === 1) {
      amounts.push(totalAmount);
    } else {
      let remaining = totalAmount;
      for (let i = 0; i < totalDebitLines - 1; i++) {
        const portion = round2(remaining * (rng() * 0.5 + 0.1));
        amounts.push(portion);
        remaining = round2(remaining - portion);
      }
      amounts.push(remaining);
    }

    const vendorId =
      scenario.docType === "KR" || scenario.docType === "KZ"
        ? pick(rng, VENDOR_IDS)
        : null;
    const customerId =
      scenario.docType === "DR" || scenario.docType === "DZ"
        ? pick(rng, CUSTOMER_IDS)
        : null;

    let lineId = 1;

    // Debit lines
    for (let i = 0; i < totalDebitLines; i++) {
      const acct =
        i === 0
          ? debitAccount
          : getAccountByCategory(rng, scenario.debitCategory, weighted);
      allLines.push({
        company_code: "1000",
        posting_date: date,
        document_id: docId,
        line_id: lineId++,
        gl_account: acct.number,
        cost_center: assignCostCenter(rng, acct),
        amount: amounts[i],
        currency: "EUR",
        debit_credit: "S",
        booking_text: getBookingText(rng, acct, scenario.docType, month),
        vendor_id: vendorId,
        customer_id: customerId,
        tax_code: getTaxCode(scenario.docType, acct),
        document_type: scenario.docType,
      });
    }

    // Credit line (single, for the total)
    allLines.push({
      company_code: "1000",
      posting_date: date,
      document_id: docId,
      line_id: lineId,
      gl_account: creditAccount.number,
      cost_center: assignCostCenter(rng, creditAccount),
      amount: totalAmount,
      currency: "EUR",
      debit_credit: "H",
      booking_text: getBookingText(rng, creditAccount, scenario.docType, month),
      vendor_id: vendorId,
      customer_id: customerId,
      tax_code: getTaxCode(scenario.docType, creditAccount),
      document_type: scenario.docType,
    });
  }

  // -- Intentional anomalies --

  // 1. Near-duplicate booking texts (typos)
  // Use texts that are guaranteed to exist: expense texts + common texts
  const typos: [string, string][] = [
    ["Büromaterial", "Büromateiral"],
    ["Telefonkosten", "Telefonksoten"],
    ["Stromkosten", "Stormkosten"],
    ["Kopierpapier", "Kopeirpapier"],
    ["Internetkosten", "Interntkosten"],
    ["Heizkosten", "Heizkotsen"],
    ["Korrektur", "Korrektru"],
    ["Periodische Abgrenzung", "Periodiche Abgrenzung"],
    ["Buchung laut Beleg", "Buchung laut Bleg"],
    ["Löhne Januar", "Löhne Janua"],
    ["Löhne Februar", "Löhne Ferbruar"],
    ["Wartung Aufzug", "Warung Aufzug"],
    ["Reisekosten Vertrieb", "Reisekosten Vetrieb"],
    ["Umbuchung", "Umbuuchng"],
    ["Steuerberater", "Steuerberter"],
  ];

  const usedDocIds = new Set<string>();
  for (const [correct, typo] of typos) {
    const idx = allLines.findIndex(
      (l) => l.booking_text === correct && !usedDocIds.has(l.document_id),
    );
    if (idx !== -1) {
      usedDocIds.add(allLines[idx].document_id);
      allLines[idx] = {
        ...allLines[idx],
        booking_text: typo,
      };
      anomalies.push(
        `TYPO: Document ${allLines[idx].document_id} line ${allLines[idx].line_id}: "${typo}" (should be "${correct}")`,
      );
    }
  }

  // 2. Possible double postings (similar documents within 1-2 days)
  const doubleCandidates = allLines.filter(
    (l) => l.line_id === 1 && l.debit_credit === "S",
  );
  let doubleCount = 0;
  for (let i = 0; i < doubleCandidates.length - 1 && doubleCount < 2; i++) {
    const orig = doubleCandidates[i];
    // Create a near-duplicate document
    const newDocId = String(docNumber++);
    const [yearStr, monthStr, dayStr] = orig.posting_date.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    let day = parseInt(dayStr, 10) + (rng() < 0.5 ? 1 : 2);
    let newMonth = month;
    const daysInMonth = newMonth === 2 ? 28 : newMonth === 1 ? 31 : 30;
    if (day > daysInMonth) {
      day = day - daysInMonth;
      newMonth++;
    }
    // Clamp to Feb 28
    if (newMonth > 2 || (newMonth === 2 && day > 28)) {
      newMonth = 2;
      day = 28;
    }
    const newDate = `${year}-${String(newMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // Find all lines of the original document
    const origLines = allLines.filter(
      (l) => l.document_id === orig.document_id,
    );

    let newLineId = 1;
    for (const ol of origLines) {
      // Slightly vary the amount (within 5%)
      const variance = round2(ol.amount * (rng() * 0.05));
      const newAmount = round2(ol.amount + (rng() < 0.5 ? variance : 0));

      allLines.push({
        ...ol,
        document_id: newDocId,
        posting_date: newDate,
        line_id: newLineId++,
        amount:
          ol === origLines[origLines.length - 1]
            ? round2(
                origLines
                  .slice(0, -1)
                  .reduce(
                    (s, l2) =>
                      s +
                      round2(
                        l2.amount +
                          (rng() < 0.5
                            ? round2(l2.amount * (rng() * 0.05))
                            : 0),
                      ),
                    0,
                  ),
              )
            : newAmount,
      });
    }

    // Fix: ensure the duplicate document balances
    const dupLines = allLines.filter((l) => l.document_id === newDocId);
    const dupDebitSum = dupLines
      .filter((l) => l.debit_credit === "S")
      .reduce((s, l) => s + l.amount, 0);
    const dupCreditLines = dupLines.filter((l) => l.debit_credit === "H");
    if (dupCreditLines.length > 0) {
      // Adjust last credit line to balance
      const otherCredits = dupCreditLines
        .slice(0, -1)
        .reduce((s, l) => s + l.amount, 0);
      dupCreditLines[dupCreditLines.length - 1].amount = round2(
        dupDebitSum - otherCredits,
      );
    }

    anomalies.push(
      `DOUBLE: Document ${newDocId} (${newDate}) is a possible duplicate of ${orig.document_id} (${orig.posting_date})`,
    );
    doubleCount++;
    i += 10; // Skip ahead to spread them out
  }

  // 3. Unusual combinations
  // Personnel expense account with a vendor invoice text
  const personnelAccounts = GL_ACCOUNTS.filter(
    (a) => a.category === "Personnel expenses",
  );
  const unusualLine1Idx = allLines.findIndex(
    (l) =>
      l.document_type === "KR" &&
      l.debit_credit === "S" &&
      l.gl_account.startsWith("07"),
  );
  if (unusualLine1Idx !== -1) {
    const pa = pick(rng, personnelAccounts);
    allLines[unusualLine1Idx] = {
      ...allLines[unusualLine1Idx],
      gl_account: pa.number,
      booking_text: "Lieferant Müller GmbH",
    };
    anomalies.push(
      `UNUSUAL: Document ${allLines[unusualLine1Idx].document_id} line ${allLines[unusualLine1Idx].line_id}: Personnel account ${pa.number} (${pa.name}) used with vendor invoice text`,
    );
  }

  // Rarely used asset account with a very common booking text
  const assetAccounts = GL_ACCOUNTS.filter((a) => a.category === "Assets");
  const unusualLine2Idx = allLines.findIndex(
    (l) =>
      l.document_type === "SA" &&
      l.debit_credit === "S" &&
      l.gl_account.startsWith("07"),
    // Start searching from a different position
  );
  if (unusualLine2Idx !== -1) {
    const aa = pick(rng, assetAccounts);
    allLines[unusualLine2Idx] = {
      ...allLines[unusualLine2Idx],
      gl_account: aa.number,
      cost_center: null,
      booking_text: "Büromaterial",
    };
    anomalies.push(
      `UNUSUAL: Document ${allLines[unusualLine2Idx].document_id} line ${allLines[unusualLine2Idx].line_id}: Asset account ${aa.number} (${aa.name}) used with common expense text "Büromaterial"`,
    );
  }

  // Revenue account on a debit side of a GL posting (unusual direction)
  const revenueAccounts = GL_ACCOUNTS.filter((a) => a.category === "Revenue");
  const unusualLine3Idx = allLines.findIndex(
    (l, idx) =>
      idx > 50 &&
      l.document_type === "SA" &&
      l.debit_credit === "S" &&
      l.gl_account.startsWith("07"),
  );
  if (unusualLine3Idx !== -1) {
    const ra = pick(rng, revenueAccounts);
    allLines[unusualLine3Idx] = {
      ...allLines[unusualLine3Idx],
      gl_account: ra.number,
      cost_center: null,
      booking_text: "Korrektur Umsatz",
    };
    anomalies.push(
      `UNUSUAL: Document ${allLines[unusualLine3Idx].document_id} line ${allLines[unusualLine3Idx].line_id}: Revenue account ${ra.number} on debit side of GL posting`,
    );
  }

  // 4. Additional unusual text-account combos to reach ~8% warning rate
  // Find lines with expense texts posted to their normal accounts and
  // swap some to wrong accounts
  const unusualSwaps: { text: string; wrongAccount: string; wrongName: string }[] = [
    { text: "Miete Büro", wrongAccount: "050000", wrongName: "Wareneinkauf" },
    { text: "Gehälter", wrongAccount: "070300", wrongName: "Bürobedarf" },
    { text: "Reisekosten Vertrieb", wrongAccount: "060000", wrongName: "Gehälter" },
    { text: "Steuerberater", wrongAccount: "070600", wrongName: "Marketing" },
  ];

  for (const swap of unusualSwaps) {
    const idx = allLines.findIndex(
      (l) =>
        l.booking_text.includes(swap.text) &&
        l.debit_credit === "S" &&
        l.gl_account !== swap.wrongAccount &&
        !anomalies.some((a) => a.includes(l.document_id)),
    );
    if (idx !== -1) {
      const origAccount = allLines[idx].gl_account;
      allLines[idx] = {
        ...allLines[idx],
        gl_account: swap.wrongAccount,
        cost_center: null,
      };
      anomalies.push(
        `UNUSUAL: Document ${allLines[idx].document_id} line ${allLines[idx].line_id}: "${swap.text}" posted to ${swap.wrongAccount} (${swap.wrongName}) instead of typical account ${origAccount}`,
      );
    }
  }

  // Sort by date, then document_id, then line_id
  allLines.sort((a, b) => {
    if (a.posting_date !== b.posting_date)
      return a.posting_date.localeCompare(b.posting_date);
    if (a.document_id !== b.document_id)
      return a.document_id.localeCompare(b.document_id);
    return a.line_id - b.line_id;
  });

  return { lines: allLines, anomalies };
}
