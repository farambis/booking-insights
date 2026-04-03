import type { BookingFlag } from "./booking.types";

/** Map key format: "documentId:lineId" */
export type FlagMap = Map<string, BookingFlag[]>;

export function flagKey(documentId: string, lineId: number): string {
  return `${documentId}:${lineId}`;
}

export function addFlag(map: FlagMap, key: string, flag: BookingFlag): void {
  const existing = map.get(key) ?? [];
  existing.push(flag);
  map.set(key, existing);
}
