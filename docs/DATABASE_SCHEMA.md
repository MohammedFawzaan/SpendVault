# Database Schema Overview
## Comprehensive Personal Finance Tracker — Android App

---

## Overview

- **Database:** SQLite via `expo-sqlite`
- **ORM:** Drizzle ORM (type-safe queries, auto migrations)
- **Encryption:** SQLCipher (database encrypted at rest)
- **Total Tables:** 5
- **Storage:** On-device only, single file `.db`

---

## Table 1 — `categories`

Stores all expense and income categories. Includes system defaults and user-created ones.

```sql
CREATE TABLE categories (
  id          INTEGER   PRIMARY KEY AUTOINCREMENT,
  name        TEXT      NOT NULL,
  icon        TEXT      NOT NULL,       -- emoji or icon identifier
  color       TEXT      NOT NULL,       -- hex color e.g. #FF5733
  type        TEXT      NOT NULL,       -- 'expense' | 'income' | 'both'
  is_default  INTEGER   DEFAULT 0,      -- 1 = system default, 0 = user created
  created_at  TEXT      NOT NULL        -- ISO datetime
);
```

### Default Categories (seeded on first launch)

| Name | Icon | Type |
|---|---|---|
| Food | 🍔 | expense |
| Transport | 🚗 | expense |
| Shopping | 🛍️ | expense |
| Bills | 💡 | expense |
| Health | 🏥 | expense |
| Entertainment | 🎬 | expense |
| Salary | 💰 | income |
| Freelance | 💻 | income |
| Cashback | 🎁 | income |
| Other | 📦 | both |

---

## Table 2 — `transactions` *(Core Table)*

The heart of the app. Every financial event — debit, credit, income, expense, lent, borrowed, pass-through, settlement — is a row here.

```sql
CREATE TABLE transactions (
  -- Identity
  id                    INTEGER   PRIMARY KEY AUTOINCREMENT,

  -- Financial fields
  amount                REAL      NOT NULL,
  type                  TEXT      NOT NULL,       -- 'debit' | 'credit'
  nature                TEXT      NOT NULL,
  -- Credit natures: 'income' | 'borrowed' | 'repayment_received' | 'pass_through'
  -- Debit  natures: 'expense' | 'lent' | 'repayment_made' | 'pass_through'

  -- Full story fields (the 8 W's)
  who                   TEXT,                     -- payer or payee name / merchant
  what                  TEXT,                     -- what the transaction was for
  date                  TEXT      NOT NULL,       -- ISO datetime e.g. 2026-06-27T14:30:00
  where_location        TEXT,                     -- location or platform (Swiggy, petrol pump)
  why                   TEXT,                     -- purpose or reason
  payment_method        TEXT      NOT NULL,       -- 'cash' | 'upi' | 'card' | 'bank_transfer'
  category_id           INTEGER,                  -- FK → categories.id
  paid_for              TEXT,                     -- who this was paid for (null = for self)

  -- Extra detail
  note                  TEXT,                     -- any additional context

  -- Month and year (denormalized for fast filtering)
  month                 INTEGER   NOT NULL,       -- 1 to 12 (derived from date on insert)
  year                  INTEGER   NOT NULL,       -- e.g. 2026 (derived from date on insert)

  -- Source tracking
  source                TEXT      DEFAULT 'manual', -- 'manual' | 'sms'
  confirmed             INTEGER   DEFAULT 1,      -- 0 = unconfirmed SMS, 1 = confirmed
  upi_ref               TEXT,                     -- UPI reference number (from SMS)

  -- Timestamps
  created_at            TEXT      NOT NULL,
  updated_at            TEXT      NOT NULL,

  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### Nature Field — Complete Reference

| Nature | Type | Counts In Dashboard | Description |
|---|---|---|---|
| `income` | Credit | ✅ Real Income | Salary, freelance, gifts, cashback |
| `borrowed` | Credit | ❌ Excluded | Money lent to you, not yours |
| `repayment_received` | Credit | ❌ Excluded | Someone returning money you lent them |
| `pass_through` | Credit | ❌ Excluded | Credited to pay on someone's behalf |
| `expense` | Debit | ✅ Real Expense | Food, bills, shopping, travel |
| `lent` | Debit | ❌ Excluded | You gave money to someone |
| `repayment_made` | Debit | ❌ Excluded | You returning borrowed money |
| `pass_through` | Debit | ❌ Excluded | You paid on someone else's behalf |

### `paid_for` Field

Captures who the debit was actually paid for when it was not for yourself.

```
Example:
  You pay ₹2,000 at a restaurant → but the bill was your mother's

  amount         = 2000
  type           = 'debit'
  nature         = 'lent'
  who            = 'Taj Restaurant'
  paid_for       = 'Mother'
  why            = 'Family dinner'
  payment_method = 'upi'

  Result: ₹2,000 excluded from your real expenses.
          Mother owes you ₹2,000 (track via queries on paid_for + nature = 'lent')
```

### `month` and `year` Fields

Denormalized from `date` at insert time for fast, index-friendly filtering:

```sql
-- Fast month/year query (no date parsing)
SELECT * FROM transactions
WHERE year = 2026 AND month = 6;

-- Without denormalization (slower at scale)
SELECT * FROM transactions
WHERE strftime('%Y', date) = '2026'
AND   strftime('%m', date) = '06';
```

### `confirmed` Field

Used for SMS auto-parsed transactions that are pending user completion:

```
confirmed = 0 → auto-created from SMS, fields incomplete, shown as pending
confirmed = 1 → user has filled all details, fully recorded
```

---

## Table 3 — `budgets`

Monthly spending limits per category.

```sql
CREATE TABLE budgets (
  id              INTEGER   PRIMARY KEY AUTOINCREMENT,
  category_id     INTEGER   NOT NULL,    -- FK → categories.id
  month           INTEGER   NOT NULL,    -- 1 to 12
  year            INTEGER   NOT NULL,    -- e.g. 2026
  limit_amount    REAL      NOT NULL,    -- monthly spend limit in ₹
  created_at      TEXT      NOT NULL,

  UNIQUE (category_id, month, year),    -- one budget per category per month
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### How Budget Progress Is Calculated

```sql
-- Get actual spend for a category in a given month/year
SELECT SUM(amount) AS spent
FROM transactions
WHERE category_id = :categoryId
  AND month = :month
  AND year = :year
  AND type = 'debit'
  AND nature = 'expense'
  AND confirmed = 1;

-- Compare with budget limit
-- spent / limit_amount * 100 = percentage used
-- If spent >= limit_amount → budget exceeded → alert triggered
-- If spent >= limit_amount * 0.8 → approaching limit → warning shown
```

---

## Table 4 — `savings_goals`

Tracks progress toward financial targets.

```sql
CREATE TABLE savings_goals (
  id              INTEGER   PRIMARY KEY AUTOINCREMENT,
  title           TEXT      NOT NULL,       -- e.g. "Save for laptop"
  target_amount   REAL      NOT NULL,       -- ₹1,00,000
  saved_amount    REAL      DEFAULT 0,      -- updated manually by user
  deadline        TEXT,                     -- ISO date, optional
  status          TEXT      DEFAULT 'active', -- 'active' | 'completed'
  created_at      TEXT      NOT NULL,
  updated_at      TEXT      NOT NULL
);
```

### Goal Progress Display (Numbers Only)
```
Goal: Save for Laptop
─────────────────────────
Target       ₹1,00,000
Saved        ₹35,000
Remaining    ₹65,000
Progress     35%
Deadline     Dec 2026
```

---

## Table 5 — `config`

Key-value store for app-wide configuration and settings.

```sql
CREATE TABLE config (
  key     TEXT    PRIMARY KEY,
  value   TEXT    NOT NULL
);
```

### Config Keys

| Key | Example Value | Description |
|---|---|---|
| `salary_date` | `"5"` | Day of month salary is expected |
| `salary_amount` | `"52000"` | Expected monthly salary in ₹ |
| `currency` | `"₹"` | Display currency symbol |
| `lock_enabled` | `"true"` | App biometric/PIN lock toggle |
| `last_backup_at` | `"2026-06-27T10:00:00Z"` | Last successful backup timestamp |
| `backup_password_hash` | `"<bcrypt hash>"` | Hashed backup encryption password |
| `app_version` | `"1.0.0"` | Current app version (for migration checks) |

---

## Entity Relationship Diagram

```
categories
──────────
id  ◄────────────────────┐
name                      │
icon                      │
color                     │
type                      │
is_default                │
created_at                │
                          │ FK
transactions              │
────────────              │
id                        │
amount                    │
type                      │
nature                    │
who                       │
what                      │
date                      │
where_location            │
why                       │
payment_method            │
category_id ──────────────┘
paid_for
note
month
year
source
confirmed
upi_ref
created_at
updated_at


budgets
───────
id
category_id ──────────────► categories.id
month
year
limit_amount
created_at


savings_goals
─────────────
id
title
target_amount
saved_amount
deadline
status
created_at
updated_at


config
──────
key
value
```

---

## Dashboard Calculation Queries

```sql
-- Real Income (current month)
SELECT SUM(amount) FROM transactions
WHERE type = 'credit'
  AND nature = 'income'
  AND month = :currentMonth
  AND year = :currentYear
  AND confirmed = 1;

-- Real Expenses (current month)
SELECT SUM(amount) FROM transactions
WHERE type = 'debit'
  AND nature = 'expense'
  AND month = :currentMonth
  AND year = :currentYear
  AND confirmed = 1;

-- Savings = Real Income - Real Expenses

-- Total Lent (pending recovery)
SELECT SUM(amount) FROM transactions
WHERE type = 'debit'
  AND nature = 'lent'
  AND confirmed = 1;
-- (Offset by repayment_received credits from same person)

-- Total Borrowed (pending repayment)
SELECT SUM(amount) FROM transactions
WHERE type = 'credit'
  AND nature = 'borrowed'
  AND confirmed = 1;
-- (Offset by repayment_made debits to same person)
```

---

## JSON Backup Structure

```json
{
  "version": "1.0",
  "exported_at": "2026-06-27T10:00:00Z",
  "data": {
    "transactions": [
      {
        "id": 1,
        "amount": 52000,
        "type": "credit",
        "nature": "income",
        "who": "Managix Technology",
        "what": "Monthly Salary",
        "date": "2026-06-05T10:00:00Z",
        "where_location": "Bank",
        "why": "Employment",
        "payment_method": "bank_transfer",
        "category_id": 7,
        "paid_for": null,
        "note": "June 2026 salary",
        "month": 6,
        "year": 2026,
        "source": "sms",
        "confirmed": 1,
        "upi_ref": null,
        "created_at": "2026-06-05T10:05:00Z",
        "updated_at": "2026-06-05T10:05:00Z"
      }
    ],
    "categories": [...],
    "budgets": [...],
    "savings_goals": [...],
    "config": [...]
  }
}
```

---

## Indexes

```sql
-- Fast month/year filtering (most common query)
CREATE INDEX idx_transactions_month_year
  ON transactions(year, month);

-- Filter by category
CREATE INDEX idx_transactions_category
  ON transactions(category_id);

-- Filter by nature
CREATE INDEX idx_transactions_nature
  ON transactions(nature);

-- Pending SMS transactions
CREATE INDEX idx_transactions_confirmed
  ON transactions(confirmed);

-- Budget lookup
CREATE INDEX idx_budgets_category_month_year
  ON budgets(category_id, year, month);
```
