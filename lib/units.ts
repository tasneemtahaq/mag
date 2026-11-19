export const CM_PER_INCH = 2.54;

// What an admin types (inches, as text) -> what the database keeps (centimetres, as text).
// An empty box means "no size".
export function cmFromInches(inches: string) {
  const value = Number(inches);
  if (inches.trim() === "" || !Number.isFinite(value)) return null;
  return (Math.round(value * CM_PER_INCH * 100) / 100).toFixed(2);
}

// What the database keeps -> what an admin sees. 91.44 becomes "36".
export function inchesFromCm(cm: { toString(): string } | null | undefined) {
  if (cm === null || cm === undefined) return "";
  const value = Number(cm.toString());
  if (!Number.isFinite(value) || value <= 0) return "";
  return String(Number((value / CM_PER_INCH).toFixed(2)));
}