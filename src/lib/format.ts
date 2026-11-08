// Shared number formatters (docs/conventions.md): money as `100,000.00 SEK`, percentages as `+1.25%`.

const twoDecimals = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const quantityFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });

/** `formatMoney(100000)` → `"100,000.00 SEK"`; `formatMoney(-5.5, 'USD')` → `"-5.50 USD"`. */
export function formatMoney(value: number, currency = 'SEK'): string {
  return `${twoDecimals.format(value)} ${currency}`;
}

/** `formatPercent(1.25)` → `"+1.25%"`, `formatPercent(-0.5)` → `"-0.50%"`, `formatPercent(0)` → `"0.00%"`. */
export function formatPercent(value: number): string {
  const text = twoDecimals.format(value);
  if (text === '0.00' || text === '-0.00') return '0.00%';
  return value > 0 ? `+${text}%` : `${text}%`;
}

/** Share quantities (up to 4 decimals), no trailing zeros: `10` → `"10"`, `2.5` → `"2.5"`, `1234.12345` → `"1,234.1235"`. */
export function formatQuantity(quantity: number): string {
  return quantityFormat.format(quantity);
}
