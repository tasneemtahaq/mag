// Money is stored as a number and only turned into text when displayed.
export function formatPrice(amount: number, currency = "PKR") {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
const CM_PER_INCH = 2.54;
const round1 = (value: number) => Math.round(value * 10) / 10;

// "60 × 90 cm (23.6 × 35.4 in)". Returns null when no size is known.
export function formatDimensions(
  width: number | null,
  height: number | null,
  depth: number | null,
) {
  const parts = [width, height, depth].filter(
    (value): value is number => value !== null && value > 0,
  );
  if (parts.length === 0) return null;

  const cm = parts.map((value) => round1(value)).join(" × ");
  const inches = parts.map((value) => round1(value / CM_PER_INCH)).join(" × ");
  return `${cm} cm (${inches} in)`;
}
// The sequential number shown to customers: order 1 becomes MAG-1001
export function formatOrderNumber(number: number) {
  return `MAG-${1000 + number}`;
}
// "4 Oct 2026, 3:15 pm" in Pakistan time.
// (The official name of Pakistan's time zone in computers is Asia/Karachi.)
export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  }).format(date);
}