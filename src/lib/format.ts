// en-US grouping and dot decimals on purpose: this matches the API's emails ("R{:.2}")
// and PayFast amounts, and avoids en-ZA's comma-decimal output ("R 65,00") differing
// between Node (SSR) and browsers.
const zarNumber = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 12345 -> "R 123.45" (integer cents in, display out). */
export function formatZAR(cents: number): string {
  const negative = cents < 0;
  const body = zarNumber.format(Math.abs(cents) / 100);
  return `${negative ? '-' : ''}R ${body}`;
}

/**
 * Parse a rand amount typed by a user ("1 200,50", "1200.5") into integer cents.
 * Returns undefined for empty or invalid input.
 */
export function randsToCents(input: string): number | undefined {
  const cleaned = input.replace(/\s/g, '').replace(',', '.');
  if (cleaned === '') return undefined;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return undefined;
  return Math.round(value * 100);
}

/** ISO timestamp -> "15 Oct 2026". Use only in client components (locale/timezone). */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** ISO timestamp -> "15 Oct 2026, 14:05". */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Join truthy class names. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** Today as YYYY-MM-DD in the user's local calendar (for <input type="date" min>). */
export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
