export function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/** Parse a user amount string like "12.50" or "12" into integer cents. */
export function parseAmountToCents(input: string): number | null {
  const trimmed = input.trim().replace(/[^0-9.]/g, '');
  if (!trimmed || trimmed === '.') return null;
  const parts = trimmed.split('.');
  if (parts.length > 2) return null;
  const dollars = parts[0] === '' ? 0 : Number(parts[0]);
  if (!Number.isFinite(dollars) || dollars < 0) return null;
  let cents = 0;
  if (parts[1] !== undefined) {
    const frac = (parts[1] + '00').slice(0, 2);
    cents = Number(frac);
    if (!Number.isFinite(cents)) return null;
  }
  return Math.round(dollars * 100) + cents;
}

export function centsToInputString(cents: number): string {
  return (cents / 100).toFixed(2);
}
