// Drizzle ORM Schema — 6 tables.
import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const userProfile = sqliteTable('user_profile', {
  id: integer('id').primaryKey().default(1),
  username: text('username').notNull(),
  dateOfBirth: text('date_of_birth'),
  occupation: text('occupation'),
  avatar: text('avatar'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  type: text('type', { enum: ['expense', 'income', 'both'] }).notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  amount: real('amount').notNull(),
  type: text('type', { enum: ['debit', 'credit'] }).notNull(),
  nature: text('nature').notNull(),
  who: text('who'),
  what: text('what'),
  date: text('date').notNull(),
  whereLocation: text('where_location'),
  why: text('why'),
  paymentMethod: text('payment_method', { enum: ['cash', 'upi', 'card', 'bank_transfer'] }).notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  note: text('note'),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  source: text('source', { enum: ['manual', 'sms'] }).default('manual'),
  confirmed: integer('confirmed', { mode: 'boolean' }).default(true),
  upiRef: text('upi_ref'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const budgets = sqliteTable('budgets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  limitAmount: real('limit_amount').notNull(),
  createdAt: text('created_at').notNull(),
}, (t) => [
  uniqueIndex('idx_budgets_cat_month_year').on(t.categoryId, t.month, t.year),
]);

export const savingsGoals = sqliteTable('savings_goals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  targetAmount: real('target_amount').notNull(),
  savedAmount: real('saved_amount').default(0),
  deadline: text('deadline'),
  status: text('status', { enum: ['active', 'completed'] }).default('active'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const config = sqliteTable('config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// Inferred TypeScript types
export type UserProfile = typeof userProfile.$inferSelect;
export type InsertUserProfile = typeof userProfile.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = typeof savingsGoals.$inferInsert;

export type Config = typeof config.$inferSelect;
