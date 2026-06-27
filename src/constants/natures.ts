// Transaction nature definitions (PRD §3.1 + DATABASE_SCHEMA.md §Table 3)

export type TransactionType = 'debit' | 'credit';

export type DebitNature = 'expense' | 'lent' | 'repayment_made' | 'pass_through';
export type CreditNature = 'income' | 'borrowed' | 'repayment_received' | 'pass_through';
export type Nature = DebitNature | CreditNature;

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer';

export const DEBIT_NATURES: { value: DebitNature; label: string }[] = [
  { value: 'expense', label: 'Expense' },
  { value: 'lent', label: 'Lent' },
  { value: 'repayment_made', label: 'Repayment Made' },
  { value: 'pass_through', label: 'Pass-through' },
];

export const CREDIT_NATURES: { value: CreditNature; label: string }[] = [
  { value: 'income', label: 'Income' },
  { value: 'borrowed', label: 'Borrowed' },
  { value: 'repayment_received', label: 'Repayment Received' },
  { value: 'pass_through', label: 'Pass-through' },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash', label: 'Cash', icon: 'Banknote' },
  { value: 'upi', label: 'UPI', icon: 'Smartphone' },
  { value: 'card', label: 'Card', icon: 'CreditCard' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: 'Building2' },
];

export const DASHBOARD_COUNTED_CREDIT_NATURES: CreditNature[] = ['income'];
export const DASHBOARD_COUNTED_DEBIT_NATURES: DebitNature[] = ['expense'];

const NATURE_LABELS: Record<Nature, string> = {
  income: 'Income',
  borrowed: 'Borrowed',
  repayment_received: 'Repayment Received',
  pass_through: 'Pass-through',
  expense: 'Expense',
  lent: 'Lent',
  repayment_made: 'Repayment Made',
};

export function getNatureLabel(nature: Nature): string {
  return NATURE_LABELS[nature] ?? nature;
}
