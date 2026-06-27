# Database Schema Overview
## SpendVault — Comprehensive Personal Finance Tracker — Android App

---

## Overview

- Database: SQLite via expo-sqlite
- ORM: Drizzle ORM (type-safe queries, auto migrations)
- Encryption: None (plain SQLite, no SQLCipher)
- Total Tables: 6
- Storage: App internal private storage only (/data/data/com.spendvault/databases/)
  - NOT accessible by other apps or file managers
  - The JSON backup (not the .db file) is what goes to /Downloads/ for user access

---

## Table 1 — user_profile

Single-row table. Created during onboarding. Stores the user's personal identity for the app.

```sql
CREATE TABLE user_profile (
  id            INTEGER   PRIMARY KEY DEFAULT 1,  -- always single row, id always = 1
  username      TEXT      NOT NULL,               -- required, set during onboarding
  date_of_birth TEXT,                             -- optional, ISO date e.g. 2000-01-15
  occupation    TEXT,                             -- optional, e.g. "Software Engineer"
  avatar        TEXT,                             -- local file path to photo, or null (shows initials)
  created_at    TEXT      NOT NULL,
  updated_at    TEXT      NOT NULL
);
```

### Profile Display on Profile Tab
```
Avatar (photo or initials from username)
Username
Occupation
Real-time date and time
Current month salary (queried from transactions)
Last salary credited date (queried from transactions)
Current month total spent vs total budget limit
```

### Notes
- Always single row — id is hardcoded to 1
- On first launch: created during onboarding Screen 2
- Editable anytime from Settings screen
- Avatar is a local file path; if null, app shows initials derived from username

---

## Table 2 — categories

Stores all expense and income categories. Includes system defaults and user-created ones.

```sql
CREATE TABLE categories (
  id          INTEGER   PRIMARY KEY AUTOINCREMENT,
  name        TEXT      NOT NULL,
  icon        TEXT      NOT NULL,       -- emoji or lucide icon name
  color       TEXT      NOT NULL,       -- hex color e.g. #FF5733
  type        TEXT      NOT NULL,       -- 'expense' | 'income' | 'both'
  is_default  INTEGER   DEFAULT 0,      -- 1 = system default (cannot delete), 0 = user created
  created_at  TEXT      NOT NULL
);
```

### Default Categories (seeded on first launch)

| Name | Icon | Type |
|---|---|---|
| Food | food emoji | expense |
| Transport | car emoji | expense |
| Shopping | bag emoji | expense |
| Bills | bulb emoji | expense |
| Health | hospital emoji | expense |
| Entertainment | clapper emoji | expense |
| Salary | money emoji | income |
| Freelance | laptop emoji | income |
| Cashback | gift emoji | income |
| Other | box emoji | both |

---

## Table 3 — transactions (Core Table)

The heart of the app. Every financial event — debit, credit, income, expense, lent, borrowed, pass-through, settlement — is a row here. Supports both manual entry and SMS auto-parsed entries.

```sql
CREATE TABLE transactions (
  -- Identity
  id                    INTEGER   PRIMARY KEY AUTOINCREMENT,

  -- Financial fields
  amount                REAL      NOT NULL,
  type                  TEXT      NOT NULL,
  -- 'debit' | 'credit'

  nature                TEXT      NOT NULL,
  -- Credit natures: 'income' | 'borrowed' | 'repayment_received' | 'pass_through'
  -- Debit  natures: 'expense' | 'lent' | 'repayment_made' | 'pass_through'

  -- Full story fields (the 8 Ws)
  who                   TEXT,             -- payer or payee name / merchant name
  what                  TEXT,             -- what the transaction was for
  date                  TEXT NOT NULL,    -- ISO datetime e.g. 2026-06-27T14:30:00
  where_location        TEXT,             -- location or platform e.g. Swiggy, petrol pump
  why                   TEXT,             -- purpose or reason
  payment_method        TEXT NOT NULL,    -- 'cash' | 'upi' | 'card' | 'bank_transfer'
  category_id           INTEGER,          -- FK -> categories.id
  paid_for              TEXT,             -- who this was paid for (null = for self)

  -- Extra detail
  note                  TEXT,             -- any additional context

  -- Month and year (denormalized for fast filtering)
  month                 INTEGER NOT NULL, -- 1 to 12, derived from date on insert
  year                  INTEGER NOT NULL, -- e.g. 2026, derived from date on insert

  -- Source tracking
  source                TEXT DEFAULT 'manual',  -- 'manual' | 'sms'
  confirmed             INTEGER DEFAULT 1,       -- 0 = unconfirmed SMS pending, 1 = confirmed
  upi_ref               TEXT,                    -- UPI reference number from SMS

  -- Timestamps
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL,

  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### Nature Field — Complete Reference

| Nature | Type | Dashboard | Description |
|---|---|---|---|
| income | Credit | Counted as Real Income | Salary, freelance, gifts, cashback |
| borrowed | Credit | Excluded | Money lent to you, not yours |
| repayment_received | Credit | Excluded | Someone returning money you lent |
| pass_through | Credit | Excluded | Credited to pay on someone's behalf |
| expense | Debit | Counted as Real Expense | Food, bills, shopping, travel |
| lent | Debit | Excluded | You gave money to someone |
| repayment_made | Debit | Excluded | You returning borrowed money |
| pass_through | Debit | Excluded | You paid on someone else's behalf |

### paid_for Field

Captures who the payment was for when it was not for yourself.

```
Example:
  You pay 2,000 at a restaurant but the bill was your mother's

  amount         = 2000
  type           = 'debit'
  nature         = 'lent'
  who            = 'Taj Restaurant'
  paid_for       = 'Mother'
  why            = 'Family dinner'
  payment_method = 'upi'

  Result: 2,000 excluded from your real expenses
          Mother owes you 2,000
          (queryable: WHERE paid_for = 'Mother' AND nature = 'lent')
```

### month and year Fields

Denormalized from date at insert time for fast, index-friendly filtering.

```sql
-- Fast query — no date parsing needed
SELECT * FROM transactions
WHERE year = 2026 AND month = 6;
```

### confirmed Field

```
confirmed = 0 -> auto-created from SMS, fields incomplete, shown as pending in Transactions tab
confirmed = 1 -> user has completed all fields, fully recorded
```

### Transaction Actions on DB Level
```
CREATE  -> INSERT INTO transactions (...) VALUES (...)
EDIT    -> UPDATE transactions SET ... WHERE id = :id
DELETE  -> DELETE FROM transactions WHERE id = :id
```

---

## Table 4 — budgets

Monthly spending limits per category.

```sql
CREATE TABLE budgets (
  id              INTEGER   PRIMARY KEY AUTOINCREMENT,
  category_id     INTEGER   NOT NULL,    -- FK -> categories.id
  month           INTEGER   NOT NULL,    -- 1 to 12
  year            INTEGER   NOT NULL,    -- e.g. 2026
  limit_amount    REAL      NOT NULL,    -- monthly spend limit
  created_at      TEXT      NOT NULL,

  UNIQUE (category_id, month, year),    -- one budget per category per month
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### Budget Progress Calculation

```sql
-- Actual spend for a category in a given month/year
SELECT SUM(amount) AS spent
FROM transactions
WHERE category_id = :categoryId
  AND month = :month
  AND year = :year
  AND type = 'debit'
  AND nature = 'expense'
  AND confirmed = 1;

-- spent / limit_amount * 100 = percentage used
-- If percentage >= 80  -> approaching limit warning
-- If percentage >= 100 -> budget exceeded alert
```

---

## Table 5 — savings_goals

Tracks progress toward financial targets.

```sql
CREATE TABLE savings_goals (
  id              INTEGER   PRIMARY KEY AUTOINCREMENT,
  title           TEXT      NOT NULL,             -- e.g. "Save for laptop"
  target_amount   REAL      NOT NULL,             -- e.g. 100000
  saved_amount    REAL      DEFAULT 0,            -- updated manually by user
  deadline        TEXT,                           -- ISO date, optional
  status          TEXT      DEFAULT 'active',     -- 'active' | 'completed'
  created_at      TEXT      NOT NULL,
  updated_at      TEXT      NOT NULL
);
```

### Goal Progress Display (Numbers Only)
```
Goal: Save for Laptop
Target       1,00,000
Saved          35,000
Remaining      65,000
Progress          35%
Deadline     Dec 2026
```

---

## Table 6 — config

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
| currency | rupee symbol | Display currency symbol |
| last_backup_at | 2026-06-27T00:00:00Z | Last successful backup timestamp |
| app_version | 1.0.0 | Current app version (used in backup validation) |
| onboarding_complete | true | Whether onboarding has been completed |
| sms_permission_granted | true | Whether READ_SMS permission was granted |

---

## Entity Relationship Diagram

```
user_profile (single row)
─────────────────────────
id (always 1)
username
date_of_birth
occupation
avatar
created_at
updated_at


categories
──────────
id  <──────────────────────┐
name                        |
icon                        |
color                       |  FK
type                        |
is_default                  |
created_at                  |
                            |
transactions                |
────────────                |
id                          |
amount                      |
type                        |
nature                      |
who                         |
what                        |
date                        |
where_location              |
why                         |
payment_method              |
category_id ────────────────┘
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
category_id ─────────────── categories.id
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

-- Total Lent outstanding
SELECT SUM(amount) FROM transactions
WHERE type = 'debit'
  AND nature = 'lent'
  AND confirmed = 1;

-- Total Borrowed outstanding
SELECT SUM(amount) FROM transactions
WHERE type = 'credit'
  AND nature = 'borrowed'
  AND confirmed = 1;

-- Current month salary (most recent income transaction)
SELECT amount, date FROM transactions
WHERE type = 'credit'
  AND nature = 'income'
  AND month = :currentMonth
  AND year = :currentYear
  AND confirmed = 1
ORDER BY date DESC
LIMIT 1;

-- Top spending category (current month)
SELECT category_id, SUM(amount) AS total
FROM transactions
WHERE type = 'debit'
  AND nature = 'expense'
  AND month = :currentMonth
  AND year = :currentYear
  AND confirmed = 1
GROUP BY category_id
ORDER BY total DESC
LIMIT 1;
```

---

## JSON Backup Structure

Plain JSON — no encryption. Saved to /Downloads/expense-backup.json on device.

```json
{
  "version": "1.0",
  "exported_at": "2026-06-27T00:00:00Z",
  "data": {
    "user_profile": {
      "id": 1,
      "username": "Fawzaan",
      "date_of_birth": "2002-05-10",
      "occupation": "Software Engineer",
      "avatar": null,
      "created_at": "2026-01-01T10:00:00Z",
      "updated_at": "2026-01-01T10:00:00Z"
    },
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
    "categories": [],
    "budgets": [],
    "savings_goals": [],
    "config": []
  }
}
```

### Backup Validation Rules (on Restore)
```
1. Is it valid parseable JSON?          -> if not, abort with error
2. Does it have "version" key?          -> if not, abort with error
3. Is version compatible with app?      -> if not, abort with error
4. Does "data" key exist?               -> if not, abort with error
5. Does data have all required tables?  -> if not, abort with error
6. All checks pass                      -> proceed with restore
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