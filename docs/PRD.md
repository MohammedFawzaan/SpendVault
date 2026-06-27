# Product Requirements Document (PRD)
## Comprehensive Personal Finance Tracker — Android App

---

## 1. Product Overview

### 1.1 Product Summary
A comprehensive, offline-first personal finance tracker for Android. Designed for a single user to track every financial transaction — income, expenses, salary, credits, debits, pass-throughs, settlements, and on-behalf payments — with full contextual story for every transaction.

### 1.2 Target User
- Individual working professional
- Single user per device
- Android device user
- Primarily transacts via UPI (Google Pay, PhonePe, Paytm) and cash

### 1.3 Platform
- **Android only** (iOS excluded due to SMS permission restrictions)
- Distributed via APK file
- Offline-first — no internet connection required

### 1.4 Distribution Model
- APK distributed to any Android device
- Each device is fully isolated — one device, one user, one database
- No shared server, no shared data between devices
- Phone migration handled via JSON backup export/import

---

## 2. Core Principles

- **Offline-first** — app must work fully without internet
- **Full story** — every transaction captures complete context
- **No charts or analytics** — numbers and lists only
- **No reports or exports** (except backup)
- **No backend server** — all data lives on device
- **Secure** — encrypted database, biometric/PIN lock
- **SMS auto-parsing** — auto-detect transactions from bank SMS

---

## 3. Modules & Features

### 3.1 Transactions *(Core Module)*

Every transaction must capture the complete story:

| Field | Description | Required |
|---|---|---|
| Amount | ₹ value | ✅ |
| Type | Debit or Credit | ✅ |
| Nature | Financial classification | ✅ |
| Who | Person or merchant name | ✅ |
| What | What the transaction was for | ✅ |
| When | Date and time | ✅ |
| Where | Location or platform (e.g. Swiggy, petrol pump) | ❌ |
| Why | Purpose or reason | ❌ |
| How | Payment method | ✅ |
| Which | Category | ✅ |
| Paid For | Who this was paid for (null if for self) | ❌ |
| Note | Any additional detail | ❌ |
| Source | Manual or SMS auto-parsed | Auto |
| UPI Ref | UPI reference number | Auto (if SMS) |
| Month | Derived from date | Auto |
| Year | Derived from date | Auto |

#### Transaction Types
- **Debit** — money going out
- **Credit** — money coming in

#### Transaction Natures
| Nature | Type | Description |
|---|---|---|
| `income` | Credit | Salary, freelance, gift, cashback |
| `borrowed` | Credit | Someone lent you money |
| `repayment_received` | Credit | Someone returning money you lent |
| `pass_through` | Credit | Credited to pay on someone's behalf |
| `expense` | Debit | Food, bills, shopping, travel |
| `lent` | Debit | You gave money to someone |
| `repayment_made` | Debit | You returning borrowed money |
| `pass_through` | Debit | You paid on someone else's behalf |

#### Payment Methods
- Cash
- UPI
- Card
- Bank Transfer

#### Transaction Filters
- By type (debit / credit)
- By nature (income, expense, lent, borrowed, etc.)
- By category
- By payment method
- By month
- By year
- By month + year combined
- By person (who field)
- By paid_for (whose payment it was)

---

### 3.2 Income Tracking

- Log monthly salary as recurring income (nature = `income`)
- Log one-time income — freelance, gifts, cashbacks, refunds
- Auto-detected from credited bank SMS
- Separate income history view filterable by month and year
- Salary date configured in settings with monthly reminder

---

### 3.3 Budget Management

- Set a monthly spending limit per category
- Track actual spending against the limit in real time
- Visual indicator — spent ₹X of ₹Y limit (numbers only, no bar charts)
- Alert/notification when 80% of budget limit is reached
- Alert/notification when budget limit is exceeded
- One budget entry per category per month per year
- View budget status for any past month

---

### 3.4 Savings Goals

- Create a savings goal with a title and target amount
- Optionally set a deadline
- Manually update saved amount as you contribute
- Track how much is remaining to reach the goal
- Mark goal as completed when target is reached
- Multiple active goals allowed simultaneously

---

### 3.5 Dashboard *(Numbers Only — No Charts)*

Displays a clean numerical summary for the current month:

```
THIS MONTH — June 2026
─────────────────────────────────
Real Income          ₹52,000
Real Expenses        ₹31,400
Savings              ₹20,600  (39%)
─────────────────────────────────
Lent (pending)       ₹2,500
Borrowed (pending)   ₹1,000
─────────────────────────────────
Top Category         Food ₹8,200
Recent Transactions  (last 5)
```

Dashboard rules:
- Pass-through transactions excluded from all totals
- Borrowed credits excluded from real income
- Lent debits excluded from real expenses
- Repayments excluded from income and expenses
- Only `income` credits count as real income
- Only `expense` debits count as real expenses

---

### 3.6 SMS Auto-Parsing

- One-time READ_SMS permission on first launch
- Background listener for new bank SMS
- Auto-extract: amount, type (debit/credit), UPI ref, date/time
- Creates an unconfirmed transaction automatically
- User is notified — taps to open and fill remaining fields (who, what, category, nature, note)
- Confirmed transaction saved to database
- Works with all major Indian banks (HDFC, SBI, ICICI, Axis, Kotak, etc.)
- Handles UPI, card, ATM, and bank transfer SMS formats

---

### 3.7 Security

- **App lock** — biometric (fingerprint / face) or PIN on every app open
- **SQLCipher** — SQLite database encrypted at rest
- **Encrypted JSON backup** — backup file protected with user-set password
- App lock can be toggled on/off in settings
- Fallback to PIN if biometric is unavailable

---

### 3.8 Backup & Restore

#### Backup
- Automatic JSON backup triggered:
  - Once daily when app is opened
  - When app goes to background
  - Manually via "Backup Now" button in settings
- Saves to device Downloads folder as `expense-backup.json`
- Each backup overwrites the previous file (single file, always current)
- Backup file is encrypted with user-set password

#### Restore
- "Restore from Backup" option in settings
- User selects the JSON backup file
- All existing data is cleared and replaced with backup data
- Restoration confirmation prompt shown before proceeding

#### Migration (Phone Change)
- Old phone → Backup Now → share JSON to Google Drive / WhatsApp / email
- New phone → Install APK → Restore from Backup → select JSON file
- Full data restored on new device

---

### 3.9 Settings

| Setting | Description |
|---|---|
| Salary Date | Day of month salary is credited (triggers reminder) |
| Salary Amount | Expected monthly salary amount |
| Currency | Default ₹ (Indian Rupee) |
| App Lock | Enable / disable biometric or PIN lock |
| Manage Categories | Add, edit, delete categories with icon and color |
| Backup Now | Manual backup trigger |
| Restore from Backup | Restore data from JSON file |
| Last Backup Time | Displayed in settings |

---

## 4. Screen Map

```
Tab 1 — Dashboard
  └── Monthly summary (income, expenses, savings, lent, borrowed)
  └── Recent 5 transactions

Tab 2 — Transactions
  └── All transactions, filterable
  └── Search by who / what / note
  └── Filter by type, nature, category, method, month, year

Tab 3 — Budget
  └── Monthly budget per category
  └── Spent vs limit (numbers)
  └── Exceeded budget alerts

Tab 4 — Goals
  └── Savings goals list
  └── Progress per goal (numbers)
  └── Add / edit / complete goals

Tab 5 — Settings
  └── All settings listed above

Floating [+] Button (visible on all tabs)
  └── Quick add transaction modal

Modals
  └── Add / Edit Transaction (full story form)
  └── Unconfirmed SMS Transaction (pre-filled, needs completion)
  └── Add / Edit Category
  └── Add / Edit Budget
  └── Add / Edit Savings Goal
  └── Restore Confirmation
```

---

## 5. Real-Life Scenarios Handled

| Scenario | How Tracked |
|---|---|
| Monthly salary credited | Credit, nature = income |
| Restaurant bill paid by you for mother | Debit, nature = lent, paid_for = Mother |
| Friend lends you ₹500 cash | Credit, nature = borrowed, who = Friend name |
| You return ₹250 to friend via UPI | Debit, nature = repayment_made, who = Friend name |
| Raju credits ₹1000, you pay Akbar ₹1000 | Two pass_through transactions, note captures context |
| Google Pay deduction auto-detected | SMS parsed, type = debit, source = sms |
| Cashback received | Credit, nature = income, category = Cashback |
| Electricity bill paid | Debit, nature = expense, category = Bills |

---

## 6. What This App Is NOT

- ❌ No charts, graphs, or visual analytics
- ❌ No reports or PDF/CSV exports
- ❌ No backend server or cloud database
- ❌ No multi-user or multi-device sync
- ❌ No login or authentication system
- ❌ No iOS support
- ❌ No in-app notifications beyond budget alerts
