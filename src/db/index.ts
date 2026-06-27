import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const expo = openDatabaseSync('spendvault.db');
export const db = drizzle(expo, { schema });

// Creates all tables and indexes on first run (idempotent — IF NOT EXISTS)
export function initializeDatabase(): void {
  expo.execSync('PRAGMA journal_mode=WAL;');

  expo.execSync(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id            INTEGER   PRIMARY KEY DEFAULT 1,
      username      TEXT      NOT NULL,
      date_of_birth TEXT,
      occupation    TEXT,
      avatar        TEXT,
      created_at    TEXT      NOT NULL,
      updated_at    TEXT      NOT NULL
    );
  `);

  expo.execSync(`
    CREATE TABLE IF NOT EXISTS categories (
      id          INTEGER   PRIMARY KEY AUTOINCREMENT,
      name        TEXT      NOT NULL,
      icon        TEXT      NOT NULL,
      color       TEXT      NOT NULL,
      type        TEXT      NOT NULL CHECK(type IN ('expense','income','both')),
      is_default  INTEGER   DEFAULT 0,
      created_at  TEXT      NOT NULL
    );
  `);

  expo.execSync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id              INTEGER   PRIMARY KEY AUTOINCREMENT,
      amount          REAL      NOT NULL,
      type            TEXT      NOT NULL CHECK(type IN ('debit','credit')),
      nature          TEXT      NOT NULL,
      who             TEXT,
      what            TEXT,
      date            TEXT      NOT NULL,
      where_location  TEXT,
      why             TEXT,
      payment_method  TEXT      NOT NULL CHECK(payment_method IN ('cash','upi','card','bank_transfer')),
      category_id     INTEGER   REFERENCES categories(id),
      note            TEXT,
      month           INTEGER   NOT NULL,
      year            INTEGER   NOT NULL,
      source          TEXT      DEFAULT 'manual' CHECK(source IN ('manual','sms')),
      confirmed       INTEGER   DEFAULT 1,
      upi_ref         TEXT,
      created_at      TEXT      NOT NULL,
      updated_at      TEXT      NOT NULL
    );
  `);

  expo.execSync(`
    CREATE TABLE IF NOT EXISTS budgets (
      id            INTEGER   PRIMARY KEY AUTOINCREMENT,
      category_id   INTEGER   NOT NULL REFERENCES categories(id),
      month         INTEGER   NOT NULL,
      year          INTEGER   NOT NULL,
      limit_amount  REAL      NOT NULL,
      created_at    TEXT      NOT NULL,
      UNIQUE(category_id, month, year)
    );
  `);

  expo.execSync(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id            INTEGER   PRIMARY KEY AUTOINCREMENT,
      title         TEXT      NOT NULL,
      target_amount REAL      NOT NULL,
      saved_amount  REAL      DEFAULT 0,
      deadline      TEXT,
      status        TEXT      DEFAULT 'active' CHECK(status IN ('active','completed')),
      created_at    TEXT      NOT NULL,
      updated_at    TEXT      NOT NULL
    );
  `);

  expo.execSync(`
    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  expo.execSync(`CREATE INDEX IF NOT EXISTS idx_tx_month_year   ON transactions(year, month);`);
  expo.execSync(`CREATE INDEX IF NOT EXISTS idx_tx_category     ON transactions(category_id);`);
  expo.execSync(`CREATE INDEX IF NOT EXISTS idx_tx_nature       ON transactions(nature);`);
  expo.execSync(`CREATE INDEX IF NOT EXISTS idx_tx_confirmed    ON transactions(confirmed);`);
  expo.execSync(`CREATE INDEX IF NOT EXISTS idx_bgt_cat_my      ON budgets(category_id, year, month);`);
}
