# Product Requirements Document (PRD)
## SpendVault — Comprehensive Personal Finance Tracker — Android App

---

## 1. Product Overview

### 1.1 Product Summary
A comprehensive, offline-first personal finance tracker for Android. Designed for a single user to track every financial transaction — income, expenses, salary, credits, debits, pass-throughs, settlements, and on-behalf payments — with full contextual story for every transaction.

### 1.2 Target User
- Individual
- Single user per device
- Android device user
- Primarily transacts via UPI (Google Pay, PhonePe, Paytm) and cash

### 1.3 Platform
- Android only (iOS excluded due to SMS permission restrictions)
- Distributed via APK file
- Offline-first — no internet connection required

### 1.4 Distribution Model
- APK distributed to any Android device
- Each device is fully isolated — one device, one user, one database
- No shared server, no shared data between devices
- Phone migration handled via JSON backup export/import

---

## 2. Core Principles

- Offline-first — app must work fully without internet
- Full story — every transaction captures complete context
- No charts or analytics — numbers and lists only
- No reports or exports (except backup)
- No backend server — all data lives on device
- Secure — mandatory biometric/PIN lock on every app open
- SMS auto-parsing — auto-detect transactions from bank SMS
- Manual entry — user can always add credit or debit transactions manually

---

## 3. Modules & Features

### 3.1 Transactions (Core Module)

Every transaction must capture the complete story:

| Field | Description | Required |
|---|---|---|
| Amount | Value in rupees | Yes |
| Type | Debit or Credit | Yes |
| Nature | Financial classification | Yes |
| Who | Person or merchant name | Yes |
| What | What the transaction was for | Yes |
| When | Date and time | Yes |
| Where | Location or platform (e.g. Swiggy, petrol pump) | No |
| Why | Purpose or reason | No |
| How | Payment method | Yes |
| Which | Category | Yes |
| Paid For | Who this was paid for (null if for self) | No |
| Note | Any additional detail | No |
| Source | Manual or SMS auto-parsed | Auto |
| UPI Ref | UPI reference number | Auto if SMS |
| Month | Derived from date on insert | Auto |
| Year | Derived from date on insert | Auto |

#### Transaction Actions
- Create — manually add any debit or credit transaction via FAB [+] button
- Edit — tap any transaction, open edit modal, update any field, save
- Delete — swipe left on transaction, confirmation alert shown, permanently deleted on confirm

#### Transaction Types
- Debit — money going out
- Credit — money coming in

#### Transaction Natures

| Nature | Type | Dashboard | Description |
|---|---|---|---|
| income | Credit | Counted | Salary, freelance, gift, cashback |
| borrowed | Credit | Excluded | Someone lent you money |
| repayment_received | Credit | Excluded | Someone returning money you lent |
| pass_through | Credit | Excluded | Credited to pay on someone's behalf |
| expense | Debit | Counted | Food, bills, shopping, travel |
| lent | Debit | Excluded | You gave money to someone |
| repayment_made | Debit | Excluded | You returning borrowed money |
| pass_through | Debit | Excluded | You paid on someone else's behalf |

#### Payment Methods
- Cash
- UPI
- Card
- Bank Transfer

#### Transaction Filters
- By type (debit / credit)
- By nature
- By category
- By payment method
- By month
- By year
- By month + year combined
- By person (who field)
- By paid_for

---

### 3.2 Income Tracking

- Log monthly salary as a regular credit transaction (nature = income)
- Log any one-time income — freelance, gifts, cashbacks, refunds
- Both manual entry and SMS auto-detection supported
- Separate income history view filterable by month and year

---

### 3.3 Budget Management

- Set a monthly spending limit per category
- Track actual spending against the limit in real time
- Indicator shows spent amount vs limit in numbers only (no bar charts)
- Alert when 80% of budget limit is reached
- Alert when budget limit is exceeded
- One budget entry per category per month per year
- View budget status for any past month

---

### 3.4 Savings Goals

- Create a savings goal with a title and target amount
- Optionally set a deadline
- Manually update saved amount as you contribute
- Track remaining amount to reach goal
- Mark goal as completed when target is reached
- Multiple active goals allowed simultaneously

---

### 3.5 Dashboard (Numbers Only — No Charts)

Displays a clean numerical summary for the current month:

```
THIS MONTH — June 2026
Real Income          52,000
Real Expenses        31,400
Savings              20,600  (39%)
Lent (pending)        2,500
Borrowed (pending)    1,000
Top Category         Food 8,200
Recent Transactions  (last 10 listed)
```

Dashboard rules:
- Pass-through transactions excluded from all totals
- Borrowed credits excluded from real income
- Lent debits excluded from real expenses
- Repayments excluded from both
- Only income credits count as real income
- Only expense debits count as real expenses

---

### 3.6 SMS Auto-Parsing

- One-time READ_SMS permission on first launch
- Background listener for new bank SMS
- Auto-extract: amount, type (debit/credit), UPI ref, date/time
- Creates an unconfirmed transaction automatically
- Push notification sent to user — tap to open and fill remaining fields
- Confirmed transaction saved to database
- Works with all major Indian banks (HDFC, Bank of Baroda, SBI, ICICI, Axis, Kotak, etc.)
- Handles UPI, card, ATM, and bank transfer SMS formats

---

### 3.7 Security

- App lock — biometric (fingerprint / face) or PIN on every app open
- Single public screen — only the lock/unlock screen is accessible without authentication
- Every other screen is protected — dashboard, transactions, budget, goals, profile, settings — all gated behind app lock
- App lock is mandatory — cannot be disabled, always on
- Fallback to PIN if biometric is unavailable
- JSON backup — plain JSON file, no encryption

---

### 3.8 Backup & Restore

#### Backup
- Automatic JSON backup triggered:
  - Every day at 12:00 AM via background task
  - Manually via "Backup Now" button in settings
- Saves to device Downloads folder as expense-backup.json
- Each backup overwrites the previous file (single file, always current)
- Backup file is plain JSON — no encryption

#### Restore
- "Restore from Backup" option in settings
- User selects the JSON backup file
- Validation runs first — file checked for:
  - Valid JSON format
  - Required fields and structure present
  - Compatible app version
- If validation fails — error shown, restore aborted, existing data untouched
- If validation passes — confirmation prompt shown
- All existing data is cleared and replaced with backup data

#### Migration (Phone Change)
- Old phone: Backup Now, share JSON to Google Drive / WhatsApp / email
- New phone: Install APK, Restore from Backup, select JSON file
- Validation runs, if passed full data restored on new device

---

### 3.9 Settings

| Setting | Description |
|---|---|
| Profile | |
| Username | User's display name, set during onboarding, editable |
| Avatar | Profile photo or auto-generated initials, editable |
| Date of Birth | Optional, set during onboarding, editable |
| Occupation | Optional, set during onboarding, editable |
| Preferences | |
| Currency | Default Indian Rupee |
| Security | |
| App Lock | Biometric or PIN, mandatory, always on |
| Categories | |
| Manage Categories | Add, edit, delete categories with icon and color |
| Backup & Restore | |
| Backup Now | Manual backup trigger |
| Restore from Backup | Restore data from JSON file |
| Last Backup Time | Displayed in settings |

---

## 4. Screen Map

```
Tab 1 — Home (Dashboard)
  - Monthly summary: income, expenses, savings, lent, borrowed
  - Current month real-time financial snapshot
  - Recent 10 transactions listed

Tab 2 — Transactions
  - All transactions, filterable and searchable
  - Create transaction manually via FAB [+]
  - Edit any transaction via tap
  - Delete transaction via swipe left + confirm alert
  - Search by who, what, note
  - Filter by type, nature, category, method, month, year

Tab 3 — Budget & Goals
  Budget section:
    - Monthly budget per category
    - Spent vs limit in numbers
    - Exceeded budget alerts
    - Add, edit, delete budgets
  Goals section:
    - Savings goals list
    - Progress per goal in numbers
    - Add, edit, complete, delete goals

Tab 4 — Profile
  - User avatar (photo or initials)
  - Username and occupation
  - Real-time current date and time
  - Current month salary (most recent income transaction)
  - Last salary credited date
  - Current month budget overview (total spent vs total budget limit)
  - Settings button navigates to Settings screen

Settings Screen (accessed from Profile tab)
  - Profile details: username, avatar, date of birth, occupation
  - Currency preference
  - App Lock (biometric / PIN, mandatory)
  - Manage Categories
  - Backup Now
  - Restore from Backup
  - Last Backup Time

Floating [+] Button (visible on Home, Transactions, Budget & Goals tabs)
  - Quick add transaction modal (manual entry, debit or credit)

Onboarding Screens (first launch only)
  Screen 1 — Splash Screen
  Screen 2 — Profile Setup
    - Username (required)
    - Date of birth (optional)
    - Occupation (optional)
  Screen 3 — Security Setup
    - Enable biometric lock
    - Set PIN as fallback
  Screen 4 — SMS Permission request
  Screen 5 — All Set, navigate to Home

Modals
  - Add / Edit Transaction (full story form, manual debit or credit)
  - Unconfirmed SMS Transaction (pre-filled, needs completion by user)
  - Add / Edit Category
  - Add / Edit Budget
  - Add / Edit Savings Goal
  - Delete Confirmation (transactions, budgets, goals)
  - Restore Confirmation
```

---

## 5. Real-Life Scenarios Handled

| Scenario | How Tracked |
|---|---|
| Monthly salary credited | Credit, nature = income, manual or SMS auto-detected |
| Restaurant bill paid by you for mother | Debit, nature = lent, paid_for = Mother |
| Friend lends you cash | Credit, nature = borrowed, who = Friend name |
| You return money to friend via UPI | Debit, nature = repayment_made, who = Friend name |
| Raju credits you, you pay Akbar | Two pass_through transactions, note captures full context |
| Google Pay deduction auto-detected | SMS parsed, type = debit, source = sms |
| Cashback received | Credit, nature = income, category = Cashback |
| Electricity bill paid | Debit, nature = expense, category = Bills |
| Cash expense with no SMS | Manual entry, type = debit, payment_method = cash |

---

## 6. What This App Is NOT

- No charts, graphs, or visual analytics
- No reports or PDF/CSV exports
- No backend server or cloud database
- No multi-user or multi-device sync
- No login or account system (biometric/PIN only)
- No iOS support
- No in-app notifications beyond budget alerts and SMS detection