import { db } from '@/db';
import { transactions, categories, type Transaction, type InsertTransaction } from '@/db/schema';
import { eq, and, desc, like, or, sql } from 'drizzle-orm';
import { now } from '@/utils/date';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TransactionWithCategory extends Transaction {
  categoryName:  string | null;
  categoryIcon:  string | null;
  categoryColor: string | null;
}

export interface TransactionFilters {
  type?:          'debit' | 'credit';
  nature?:        string;
  categoryId?:    number;
  paymentMethod?: string;
  month?:         number;
  year?:          number;
  confirmed?:     boolean;
}

export interface DashboardStats {
  realIncome:      number;
  realExpenses:    number;
  savings:         number;
  savingsPct:      number;
  totalLent:       number;
  totalBorrowed:   number;
  topCategory:     { name: string; amount: number } | null;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function createTransaction(
  data: Omit<InsertTransaction, 'id' | 'createdAt' | 'updatedAt'>
): number {
  const timestamp = now();
  const result = db.insert(transactions)
    .values({ ...data, createdAt: timestamp, updatedAt: timestamp })
    .run();
  return result.lastInsertRowId as number;
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function updateTransaction(
  id: number,
  data: Partial<Omit<InsertTransaction, 'id' | 'createdAt'>>
): void {
  db.update(transactions)
    .set({ ...data, updatedAt: now() })
    .where(eq(transactions.id, id))
    .run();
}

export function confirmTransaction(
  id: number,
  data: Partial<Omit<InsertTransaction, 'id' | 'createdAt' | 'source'>>
): void {
  db.update(transactions)
    .set({ ...data, confirmed: true, updatedAt: now() })
    .where(eq(transactions.id, id))
    .run();
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function deleteTransaction(id: number): void {
  db.delete(transactions).where(eq(transactions.id, id)).run();
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export function getTransactionById(id: number): TransactionWithCategory | undefined {
  return db
    .select({
      id:            transactions.id,
      amount:        transactions.amount,
      type:          transactions.type,
      nature:        transactions.nature,
      who:           transactions.who,
      what:          transactions.what,
      date:          transactions.date,
      whereLocation: transactions.whereLocation,
      why:           transactions.why,
      paymentMethod: transactions.paymentMethod,
      categoryId:    transactions.categoryId,
      note:          transactions.note,
      month:         transactions.month,
      year:          transactions.year,
      source:        transactions.source,
      confirmed:     transactions.confirmed,
      upiRef:        transactions.upiRef,
      createdAt:     transactions.createdAt,
      updatedAt:     transactions.updatedAt,
      categoryName:  categories.name,
      categoryIcon:  categories.icon,
      categoryColor: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.id, id))
    .get() as TransactionWithCategory | undefined;
}

export function getTransactionsByMonthYear(
  month: number,
  year: number,
  filters?: TransactionFilters
): TransactionWithCategory[] {
  let query = db
    .select({
      id:            transactions.id,
      amount:        transactions.amount,
      type:          transactions.type,
      nature:        transactions.nature,
      who:           transactions.who,
      what:          transactions.what,
      date:          transactions.date,
      whereLocation: transactions.whereLocation,
      why:           transactions.why,
      paymentMethod: transactions.paymentMethod,
      categoryId:    transactions.categoryId,
      note:          transactions.note,
      month:         transactions.month,
      year:          transactions.year,
      source:        transactions.source,
      confirmed:     transactions.confirmed,
      upiRef:        transactions.upiRef,
      createdAt:     transactions.createdAt,
      updatedAt:     transactions.updatedAt,
      categoryName:  categories.name,
      categoryIcon:  categories.icon,
      categoryColor: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.month, month),
        eq(transactions.year, year),
        filters?.type          ? eq(transactions.type, filters.type)                   : undefined,
        filters?.nature        ? eq(transactions.nature, filters.nature)               : undefined,
        filters?.categoryId    ? eq(transactions.categoryId, filters.categoryId)       : undefined,
        filters?.paymentMethod ? eq(transactions.paymentMethod, filters.paymentMethod as any) : undefined,
        filters?.confirmed !== undefined ? eq(transactions.confirmed, filters.confirmed) : undefined,
      )
    )
    .orderBy(desc(transactions.date))
    .all();

  return query as TransactionWithCategory[];
}

export function getRecentTransactions(limit = 10): TransactionWithCategory[] {
  return db
    .select({
      id:            transactions.id,
      amount:        transactions.amount,
      type:          transactions.type,
      nature:        transactions.nature,
      who:           transactions.who,
      what:          transactions.what,
      date:          transactions.date,
      whereLocation: transactions.whereLocation,
      why:           transactions.why,
      paymentMethod: transactions.paymentMethod,
      categoryId:    transactions.categoryId,
      note:          transactions.note,
      month:         transactions.month,
      year:          transactions.year,
      source:        transactions.source,
      confirmed:     transactions.confirmed,
      upiRef:        transactions.upiRef,
      createdAt:     transactions.createdAt,
      updatedAt:     transactions.updatedAt,
      categoryName:  categories.name,
      categoryIcon:  categories.icon,
      categoryColor: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.confirmed, true))
    .orderBy(desc(transactions.date))
    .limit(limit)
    .all() as TransactionWithCategory[];
}

export function searchTransactions(
  query: string,
  month?: number,
  year?: number
): TransactionWithCategory[] {
  const pattern = `%${query}%`;
  return db
    .select({
      id:            transactions.id,
      amount:        transactions.amount,
      type:          transactions.type,
      nature:        transactions.nature,
      who:           transactions.who,
      what:          transactions.what,
      date:          transactions.date,
      whereLocation: transactions.whereLocation,
      why:           transactions.why,
      paymentMethod: transactions.paymentMethod,
      categoryId:    transactions.categoryId,
      note:          transactions.note,
      month:         transactions.month,
      year:          transactions.year,
      source:        transactions.source,
      confirmed:     transactions.confirmed,
      upiRef:        transactions.upiRef,
      createdAt:     transactions.createdAt,
      updatedAt:     transactions.updatedAt,
      categoryName:  categories.name,
      categoryIcon:  categories.icon,
      categoryColor: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        month ? eq(transactions.month, month) : undefined,
        year  ? eq(transactions.year,  year)  : undefined,
        eq(transactions.confirmed, true),
        or(
          like(transactions.who,  pattern),
          like(transactions.what, pattern),
          like(transactions.note, pattern),
        )
      )
    )
    .orderBy(desc(transactions.date))
    .all() as TransactionWithCategory[];
}

export function getUnconfirmedTransactions(): TransactionWithCategory[] {
  return db
    .select({
      id:            transactions.id,
      amount:        transactions.amount,
      type:          transactions.type,
      nature:        transactions.nature,
      who:           transactions.who,
      what:          transactions.what,
      date:          transactions.date,
      whereLocation: transactions.whereLocation,
      why:           transactions.why,
      paymentMethod: transactions.paymentMethod,
      categoryId:    transactions.categoryId,
      note:          transactions.note,
      month:         transactions.month,
      year:          transactions.year,
      source:        transactions.source,
      confirmed:     transactions.confirmed,
      upiRef:        transactions.upiRef,
      createdAt:     transactions.createdAt,
      updatedAt:     transactions.updatedAt,
      categoryName:  categories.name,
      categoryIcon:  categories.icon,
      categoryColor: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.confirmed, false))
    .orderBy(desc(transactions.date))
    .all() as TransactionWithCategory[];
}

// ─── Dashboard queries ─────────────────────────────────────────────────────────

export function getDashboardStats(month: number, year: number): DashboardStats {
  // Real income: credit + nature=income
  const incomeRow = db
    .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(and(
      eq(transactions.type, 'credit'),
      eq(transactions.nature, 'income'),
      eq(transactions.month, month),
      eq(transactions.year, year),
      eq(transactions.confirmed, true),
    ))
    .get();
  const realIncome = incomeRow?.total ?? 0;

  // Real expenses: debit + nature=expense
  const expenseRow = db
    .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(and(
      eq(transactions.type, 'debit'),
      eq(transactions.nature, 'expense'),
      eq(transactions.month, month),
      eq(transactions.year, year),
      eq(transactions.confirmed, true),
    ))
    .get();
  const realExpenses = expenseRow?.total ?? 0;

  const savings    = realIncome - realExpenses;
  const savingsPct = realIncome > 0 ? Math.round((savings / realIncome) * 100) : 0;

  // Total lent (all time, outstanding)
  const lentRow = db
    .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(and(
      eq(transactions.type, 'debit'),
      eq(transactions.nature, 'lent'),
      eq(transactions.confirmed, true),
    ))
    .get();
  const totalLent = lentRow?.total ?? 0;

  // Total borrowed (all time, outstanding)
  const borrowedRow = db
    .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(and(
      eq(transactions.type, 'credit'),
      eq(transactions.nature, 'borrowed'),
      eq(transactions.confirmed, true),
    ))
    .get();
  const totalBorrowed = borrowedRow?.total ?? 0;

  // Top spending category this month
  const topCatRow = db
    .select({
      categoryId: transactions.categoryId,
      name:       categories.name,
      total:      sql<number>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(
      eq(transactions.type, 'debit'),
      eq(transactions.nature, 'expense'),
      eq(transactions.month, month),
      eq(transactions.year, year),
      eq(transactions.confirmed, true),
    ))
    .groupBy(transactions.categoryId)
    .orderBy(desc(sql`SUM(${transactions.amount})`))
    .limit(1)
    .get();

  const topCategory = topCatRow?.name
    ? { name: topCatRow.name, amount: topCatRow.total }
    : null;

  return { realIncome, realExpenses, savings, savingsPct, totalLent, totalBorrowed, topCategory };
}

// Current month salary: most recent income credit this month
export function getCurrentMonthlySalary(
  month: number,
  year: number
): { amount: number; date: string } | null {
  const row = db
    .select({ amount: transactions.amount, date: transactions.date })
    .from(transactions)
    .where(and(
      eq(transactions.type, 'credit'),
      eq(transactions.nature, 'income'),
      eq(transactions.month, month),
      eq(transactions.year, year),
      eq(transactions.confirmed, true),
    ))
    .orderBy(desc(transactions.date))
    .limit(1)
    .get();
  return row ? { amount: row.amount, date: row.date } : null;
}

// Month/year income & expense totals (for Transactions tab summary row)
export function getMonthSummary(month: number, year: number) {
  const incomeRow = db
    .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(and(
      eq(transactions.type, 'credit'),
      eq(transactions.nature, 'income'),
      eq(transactions.month, month),
      eq(transactions.year, year),
      eq(transactions.confirmed, true),
    ))
    .get();

  const expenseRow = db
    .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(and(
      eq(transactions.type, 'debit'),
      eq(transactions.nature, 'expense'),
      eq(transactions.month, month),
      eq(transactions.year, year),
      eq(transactions.confirmed, true),
    ))
    .get();

  return {
    income:   incomeRow?.total  ?? 0,
    expenses: expenseRow?.total ?? 0,
  };
}

export function getTransactionsByNature(nature: string): TransactionWithCategory[] {
  return db
    .select({
      id:            transactions.id,
      amount:        transactions.amount,
      type:          transactions.type,
      nature:        transactions.nature,
      who:           transactions.who,
      what:          transactions.what,
      date:          transactions.date,
      whereLocation: transactions.whereLocation,
      why:           transactions.why,
      paymentMethod: transactions.paymentMethod,
      categoryId:    transactions.categoryId,
      note:          transactions.note,
      month:         transactions.month,
      year:          transactions.year,
      source:        transactions.source,
      confirmed:     transactions.confirmed,
      upiRef:        transactions.upiRef,
      createdAt:     transactions.createdAt,
      updatedAt:     transactions.updatedAt,
      categoryName:  categories.name,
      categoryIcon:  categories.icon,
      categoryColor: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.nature, nature))
    .orderBy(desc(transactions.date))
    .all() as TransactionWithCategory[];
}
