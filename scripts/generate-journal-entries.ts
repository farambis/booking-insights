import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { generateJournalEntries } from "../src/lib/data/generate-entries";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const result = generateJournalEntries();

// Log anomalies to stdout
console.log("=== Generated Anomalies ===\n");
for (const anomaly of result.anomalies) {
  console.log(`  ${anomaly}`);
}
console.log(`\nTotal anomalies: ${result.anomalies.length}`);
console.log(`Total lines: ${result.lines.length}`);

// Count unique documents
const docIds = new Set(result.lines.map((l) => l.document_id));
console.log(`Total documents: ${docIds.size}`);

// Write JSON output
const outputPath = path.resolve(
  __dirname,
  "../src/lib/data/journal-entries.json",
);
fs.writeFileSync(outputPath, JSON.stringify(result.lines, null, 2) + "\n");
console.log(`\nWritten to: ${outputPath}`);
