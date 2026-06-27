// Indian Rupee formatting utilities

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

// Formats a number as Indian Rupee: 52000 -> "52,000"
export function formatINR(amount: number): string {
  return INR_FORMATTER.format(Math.abs(amount));
}

// Formats with ₹ prefix: 52000 -> "₹52,000"
export function formatCurrency(amount: number): string {
  return `₹${formatINR(amount)}`;
}

// Formats with sign: 500 debit -> "-₹500", 500 credit -> "+₹500"
export function formatWithSign(amount: number, type: 'debit' | 'credit'): string {
  const prefix = type === 'credit' ? '+' : '-';
  return `${prefix}₹${formatINR(amount)}`;
}

// Parses a string like "52,000" or "52000" into a number
export function parseAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}
