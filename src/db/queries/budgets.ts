import { db } from '@/db';
import { budgets, categories, transactions, type Budget, type InsertBudget } from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { now } from '@/utils/date';

export interface BudgetWithProgress {
  id:            number;
  categoryId:    number;
  categoryName:  string;
  categoryIcon:  string;
  categoryColor: string;
  month:         number;
  year:          number;
  limitAmount:   number;
  spentAmount:   number;
  remaining:     number;
  percentUsed:   number;
  isWarning:     boolean; // >= 80%
  isExceeded:    boolean; // >= 100%
}

export function getBudgetsWithProgress(month: number, year: number): BudgetWithProgress[] {
  const rows = db
    .select({
      id:            budgets.id,
      categoryId:    budgets.categoryId,
      categoryName:  categories.name,
      categoryIcon:  categories.icon,
      categoryColor: categories.color,
      month:         budgets.month,
      year:          budgets.year,
      limitAmount:   budgets.limitAmount,
    })
    .from(budgets)
    .leftJoin(categories, eq(budgets.categoryId, categories.id))
    .where(and(eq(budgets.month, month), eq(budgets.year, year)))
    .all();

  return rows.map((row) => {
    const spentRow = db
      .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(and(
        eq(transactions.categoryId, row.categoryId),
        eq(transactions.month, month),
        eq(transactions.year, year),
        eq(transactions.type, 'debit'),
        eq(transactions.nature, 'expense'),
        eq(transactions.confirmed, true),
      ))
      .get();

    const spentAmount  = spentRow?.total ?? 0;
    const remaining    = row.limitAmount - spentAmount;
    const percentUsed  = row.limitAmount > 0 ? Math.round((spentAmount / row.limitAmount) * 100) : 0;

    return {
      id:            row.id,
      categoryId:    row.categoryId,
      categoryName:  row.categoryName ?? '',
      categoryIcon:  row.categoryIcon ?? '',
      categoryColor: row.categoryColor ?? '#6B7280',
      month:         row.month,
      year:          row.year,
      limitAmount:   row.limitAmount,
      spentAmount,
      remaining,
      percentUsed,
      isWarning:     percentUsed >= 80 && percentUsed < 100,
      isExceeded:    percentUsed >= 100,
    };
  });
}

export function createBudget(data: Omit<InsertBudget, 'id' | 'createdAt'>): void {
  db.insert(budgets)
    .values({ ...data, createdAt: now() })
    .onConflictDoUpdate({
      target:  [budgets.categoryId, budgets.month, budgets.year],
      set:     { limitAmount: data.limitAmount },
    })
    .run();
}

export function updateBudget(id: number, limitAmount: number): void {
  db.update(budgets).set({ limitAmount }).where(eq(budgets.id, id)).run();
}

export function deleteBudget(id: number): void {
  db.delete(budgets).where(eq(budgets.id, id)).run();
}

// Total budget limit and total spent for the profile tab summary
export function getMonthBudgetOverview(month: number, year: number) {
  const rows = db
    .select({ limitAmount: budgets.limitAmount, categoryId: budgets.categoryId })
    .from(budgets)
    .where(and(eq(budgets.month, month), eq(budgets.year, year)))
    .all();

  let totalLimit = 0;
  let totalSpent = 0;

  for (const row of rows) {
    totalLimit += row.limitAmount;
    const spentRow = db
      .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(and(
        eq(transactions.categoryId, row.categoryId),
        eq(transactions.month, month),
        eq(transactions.year, year),
        eq(transactions.type, 'debit'),
        eq(transactions.nature, 'expense'),
        eq(transactions.confirmed, true),
      ))
      .get();
    totalSpent += spentRow?.total ?? 0;
  }

  return { totalLimit, totalSpent, remaining: totalLimit - totalSpent };
}
