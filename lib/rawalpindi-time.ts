// Dates entered in the admin are Pakistan time (Rawalpindi, UTC+5, no daylight saving).
const OFFSET_MS = 5 * 60 * 60 * 1000;

// "2026-06-01" -> the very start of that day in Pakistan
export function startOfRawalpindiDay(dateText: string) {
  return new Date(`${dateText}T00:00:00+05:00`);
}

// "2026-06-30" -> the very end of that day in Pakistan
export function endOfRawalpindiDay(dateText: string) {
  return new Date(`${dateText}T23:59:59.999+05:00`);
}

// A stored moment -> "2026-06-01" as a Pakistani calendar date ("" when empty)
export function rawalpindiDateString(date: Date | null) {
  return date ? new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 10) : "";
}