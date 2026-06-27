// Date and time helpers

// ISO datetime string for the current moment
export function now(): string {
  return new Date().toISOString();
}

// Parse an ISO datetime string into a Date object
export function parseDate(iso: string): Date {
  return new Date(iso);
}

// Get current month (1-12) and year
export function currentMonthYear(): { month: number; year: number } {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

// Derive month and year from an ISO date string
export function extractMonthYear(iso: string): { month: number; year: number } {
  const d = new Date(iso);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const SHORT_MONTH_NAMES = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// "June 2026"
export function formatMonthYear(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

// "Jun 2026"
export function formatShortMonthYear(month: number, year: number): string {
  return `${SHORT_MONTH_NAMES[month - 1]} ${year}`;
}

// "5 Jun 2026"
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${SHORT_MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

// "27 Jun 2026, 2:30 PM"
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date  = `${d.getDate()} ${SHORT_MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  const hours = d.getHours();
  const mins  = String(d.getMinutes()).padStart(2, '0');
  const ampm  = hours >= 12 ? 'PM' : 'AM';
  const h12   = hours % 12 || 12;
  return `${date}, ${h12}:${mins} ${ampm}`;
}

// "2:45 PM"
export function formatTime(iso: string): string {
  const d     = new Date(iso);
  const hours = d.getHours();
  const mins  = String(d.getMinutes()).padStart(2, '0');
  const ampm  = hours >= 12 ? 'PM' : 'AM';
  const h12   = hours % 12 || 12;
  return `${h12}:${mins} ${ampm}`;
}

// "Saturday, 27 June 2026  2:45 PM" (for Profile tab)
export function formatFullDateTime(date: Date): string {
  const day   = DAY_NAMES[date.getDay()];
  const d     = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year  = date.getFullYear();
  const hours = date.getHours();
  const mins  = String(date.getMinutes()).padStart(2, '0');
  const ampm  = hours >= 12 ? 'PM' : 'AM';
  const h12   = hours % 12 || 12;
  return `${day}, ${d} ${month} ${year}  ${h12}:${mins} ${ampm}`;
}

// "TODAY", "YESTERDAY", "27 Jun" — section headers for transaction list
export function getTransactionDateLabel(iso: string): string {
  const txDate  = new Date(iso);
  const today   = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(txDate, today))     return 'TODAY';
  if (isSameDay(txDate, yesterday)) return 'YESTERDAY';
  return `${txDate.getDate()} ${SHORT_MONTH_NAMES[txDate.getMonth()]}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

// "Dec 2026" for goal deadline display
export function formatDeadline(iso: string): string {
  const d = new Date(iso);
  return `${SHORT_MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

// Previous/next month navigation
export function prevMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

export function nextMonth(month: number, year: number): { month: number; year: number } {
  if (month === 12) return { month: 1, year: year + 1 };
  return { month: month + 1, year };
}
