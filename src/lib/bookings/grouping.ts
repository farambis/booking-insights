import type { JournalEntryLine } from "@/lib/data/journal-entry.types";

/** Group journal entry lines by document_id */
export function groupByDocument(
  lines: JournalEntryLine[],
): Map<string, JournalEntryLine[]> {
  const groups = new Map<string, JournalEntryLine[]>();
  for (const line of lines) {
    const docLines = groups.get(line.document_id) ?? [];
    docLines.push(line);
    groups.set(line.document_id, docLines);
  }
  return groups;
}

/** Group items by a key function. Items where keyFn returns null are skipped. */
export function groupByField<T>(
  items: T[],
  keyFn: (item: T) => string | null,
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (key === null) continue;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}
