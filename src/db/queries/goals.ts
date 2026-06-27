import { db } from '@/db';
import { savingsGoals, type SavingsGoal, type InsertSavingsGoal } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { now } from '@/utils/date';

export function getGoals(status?: 'active' | 'completed'): SavingsGoal[] {
  if (status) {
    return db.select().from(savingsGoals).where(eq(savingsGoals.status, status)).orderBy(desc(savingsGoals.createdAt)).all();
  }
  return db.select().from(savingsGoals).orderBy(desc(savingsGoals.createdAt)).all();
}

export function getGoalById(id: number): SavingsGoal | undefined {
  return db.select().from(savingsGoals).where(eq(savingsGoals.id, id)).get();
}

export function createGoal(data: Omit<InsertSavingsGoal, 'id' | 'createdAt' | 'updatedAt'>): void {
  const timestamp = now();
  db.insert(savingsGoals)
    .values({ ...data, createdAt: timestamp, updatedAt: timestamp })
    .run();
}

export function updateGoal(
  id: number,
  data: Partial<Omit<InsertSavingsGoal, 'id' | 'createdAt'>>
): void {
  db.update(savingsGoals)
    .set({ ...data, updatedAt: now() })
    .where(eq(savingsGoals.id, id))
    .run();
}

export function addToSavedAmount(id: number, amountToAdd: number): void {
  const goal = getGoalById(id);
  if (!goal) return;
  const newSaved = (goal.savedAmount ?? 0) + amountToAdd;
  const isComplete = newSaved >= goal.targetAmount;
  db.update(savingsGoals)
    .set({
      savedAmount: newSaved,
      status:      isComplete ? 'completed' : 'active',
      updatedAt:   now(),
    })
    .where(eq(savingsGoals.id, id))
    .run();
}

export function completeGoal(id: number): void {
  db.update(savingsGoals)
    .set({ status: 'completed', updatedAt: now() })
    .where(eq(savingsGoals.id, id))
    .run();
}

export function deleteGoal(id: number): void {
  db.delete(savingsGoals).where(eq(savingsGoals.id, id)).run();
}
