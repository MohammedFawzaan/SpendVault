# UX App Flow
## Comprehensive Personal Finance Tracker — Android App

---

## Flow Overview

```
App Launch
    ↓
First time?
  Yes → Onboarding Flow
  No  → App Lock Flow
            ↓
        Main App
    ┌───────────┬────────────┬──────────┬──────────┐
 Dashboard Transactions  Budget    Goals   Settings
    └───────────┴────────────┴──────────┴──────────┘
                        ↑
                  FAB [+] (always visible)
```

---

## 1. First Launch — Onboarding Flow

Triggered once — when app is opened for the very first time.

```
Screen 1 — Welcome
──────────────────
[App logo + name]
"Your personal finance companion"

→ CTA: "Get Started"
   ↓

Screen 2 — Set Up Your Profile
──────────────────────────────
[Avatar picker — tap to set photo, or skip for initials]
Input: "Your name" (required)
Input: "Monthly salary amount" (optional, can set later)
Input: "Salary credited on day" (1–31, optional)

→ CTA: "Continue"
   ↓

Screen 3 — Set Backup Password
───────────────────────────────
"Set a password to encrypt your backups"
Input: Password
Input: Confirm Password
[i] "You'll need this to restore your data on a new phone"

→ CTA: "Continue"
   ↓

Screen 4 — Enable App Lock
───────────────────────────
[Fingerprint icon]
"Secure your app with biometric lock"
"No one else can access your data"

→ CTA: "Enable App Lock"     → triggers biometric enrollment
→ Link: "Skip for now"
   ↓

Screen 5 — SMS Permission
──────────────────────────
[SMS icon]
"Auto-detect your transactions"
"We read your bank SMS to log transactions automatically"
"Your messages never leave your device"

→ CTA: "Allow SMS Access"    → triggers READ_SMS system prompt
→ Link: "Skip, I'll add manually"
   ↓

Screen 6 — All Set
───────────────────
[Success checkmark animation]
"You're all set, [Name]!"
"Start by adding your first transaction"

→ CTA: "Go to Dashboard"
   ↓

[Main App — Dashboard Tab]
```

### Onboarding Data Saved to Config
```
user_name           → from screen 2
user_avatar         → from screen 2 (file path or null)
salary_amount       → from screen 2
salary_date         → from screen 2
backup_password     → from screen 3 (hashed)
lock_enabled        → from screen 4
sms_permission      → from screen 5
onboarding_complete → true
```

---

## 2. App Launch Flow (After Onboarding)

```
App opens
    ↓
load config: lock_enabled?
    ↓
  YES → App Lock Screen
        [Fingerprint icon]
        "Tap to unlock"
        Biometric prompt fires automatically
            ↓
        Success → Main App
        Fail    → "Try again" or "Use PIN"
                      ↓
                  PIN entry (4–6 digit)
                      ↓
                  Correct → Main App
                  Wrong   → "Incorrect PIN" shake + retry

  NO  → Main App directly
    ↓
Check: last_backup_at > 24 hours ago?
    → Yes → silent background backup triggered
    → No  → nothing

Check: unconfirmed SMS transactions?
    → Yes → badge on Transactions tab
    → No  → nothing

Check: today = salary_date?
    → Yes → push notification "Did your salary get credited?"
    → No  → nothing
```

---

## 3. Dashboard Screen

```
Arrival animation:
  Screen fades in + slides up 20px
  Cards appear with stagger (50ms delay each)
  Numbers count up from 0 to actual value (800ms)

Layout (top to bottom):
──────────────────────────────────────────────

[Header]
  "Good morning, Fawzaan 👋"     [Avatar]
  June 2026

[This Month Summary Card]
  Income    ₹52,000  (green)
  Expenses  ₹31,400  (red)
  ─────────────────────────
  Savings   ₹20,600  (39%)

[Lent · Borrowed row]
  [Lent ₹2,500 pending]   [Borrowed ₹1,000 pending]

[Recent Transactions]
  Section header: "RECENT"
  Last 5 transactions as list items
  "See all →" link → navigates to Transactions tab

User Actions:
  Tap transaction item  → open Transaction Detail modal
  Tap "See all"         → Transactions tab
  Tap avatar            → Profile screen (in Settings)
  Pull to refresh       → recalculate totals
```

---

## 4. Transactions Screen

```
Layout:
──────────────────────────────────────────────
[Header]
  "Transactions"         [Filter icon]  [Search icon]

[Month/Year Selector]
  ← June 2026 →
  Swipe left/right or tap arrows to change month

[Summary Row]
  Income ₹52,000   Expenses ₹31,400

[Filter Bar] (horizontal scroll, pill chips)
  All · Debit · Credit · Cash · UPI · Card

[Transaction List — grouped by date]
  TODAY
  ┌────────────────────────────────────┐
  │ 🍔 Swiggy             -₹450       │
  │ Food · UPI · 2:30 PM              │
  └────────────────────────────────────┘

  YESTERDAY
  ┌────────────────────────────────────┐
  │ 💰 Managix Salary    +₹52,000     │
  │ Income · Bank · 5 Jun             │
  └────────────────────────────────────┘

  [Load more on scroll]

User Actions:
  Tap transaction       → Transaction Detail Modal
  Swipe left on item    → reveal Delete button (red)
    Tap Delete          → confirmation "Delete this transaction?"
                          Yes → spring remove from list
                          No  → snap back
  Tap filter icon       → Filter Bottom Sheet
  Tap search icon       → search bar appears inline
  Type in search        → live filter by who/what/note
  Tap month arrows      → animate month change, reload list
```

### Filter Bottom Sheet
```
Opens with spring animation from bottom

Filters available:
  Type        : All | Debit | Credit
  Nature      : All | Income | Expense | Lent | Borrowed |
                Repayment | Pass-through
  Category    : [grid of category pills]
  Method      : All | Cash | UPI | Card | Bank Transfer
  Paid For    : All | Myself | [person names from data]
  Year        : dropdown

[Clear All]    [Apply Filters]

Apply → closes sheet, list updates with animation
```

### Transaction Detail Modal
```
Opens as bottom sheet

[Type badge] [Nature badge]        [Edit icon]

Amount
₹450 (red for debit / green for credit)

──────────────────────────────────
Who          Swiggy
What         Dinner order
When         27 Jun 2026, 2:30 PM
Where        Online
Why          Hungry at work
How          UPI
Category     Food
Paid For     Myself
Note         Butter chicken + naan
UPI Ref      412345678901
Source       SMS (auto-parsed)
──────────────────────────────────

[Edit Transaction]   [Delete]
```

---

## 5. Add Transaction Flow (FAB [+])

```
Tap FAB [+]
    ↓
Add Transaction Bottom Sheet springs up

Step 1 — Amount & Type
──────────────────────
[DEBIT]    [CREDIT]     ← toggle, default Debit
            (tap to switch, animates color)

    ₹ [    0    ]       ← large centered amount input
                          auto-focused, numpad opens

→ Continue (or tap next field)

Step 2 — Nature
────────────────
(shown as horizontal scroll pills based on type selected)

If Debit:   Expense | Lent | Repayment Made | Pass-through
If Credit:  Income  | Borrowed | Repayment Received | Pass-through

→ Tap one to select

Step 3 — Full Story Form
─────────────────────────
Who *         [text input]   "Person or merchant name"
What *        [text input]   "What was this for?"
Category *    [grid picker]  category icons
How *         [pill select]  Cash | UPI | Card | Bank Transfer
Date/Time     [date picker]  default: now
Where         [text input]   optional
Why           [text input]   optional
Paid For      [text input]   optional (null = myself)
Note          [text input]   optional

* required fields

[Save Transaction]  ← primary button, full width

Validation:
  Missing required field → field border turns red + shake
  Amount = 0            → "Please enter an amount"

On Save:
  Loading state on button (0.3s)
      ↓
  Write to SQLite
      ↓
  Trigger background backup check
      ↓
  Bottom sheet slides down
      ↓
  New transaction springs into list
      ↓
  Dashboard totals update
      ↓
  Toast: "Transaction saved ✓"
```

---

## 6. SMS Auto-Parse Flow

```
Bank SMS received
    ↓
react-native-get-sms-android intercepts
    ↓
Is it a known bank sender? (check against pattern list)
    ↓
  NO  → ignore
  YES → parse SMS with regex
          ↓
        Extract: amount, type, upi_ref, date
          ↓
        Create unconfirmed transaction in DB
        (confirmed = 0, source = 'sms')
          ↓
        Push notification:
        "₹450 debited detected — tap to complete"
          ↓

User taps notification
    ↓
App opens → Add Transaction Bottom Sheet
  Pre-filled:
    Amount    → from SMS
    Type      → from SMS (debit/credit)
    Date      → from SMS timestamp
    UPI Ref   → from SMS
    Source    → 'sms' (shown as badge)

  User fills:
    Who, What, Category, Nature, Where, Why, Paid For, Note
    ↓
  Tap "Save Transaction"
    ↓
  Transaction confirmed (confirmed = 1)
    ↓
  Notification dismissed

If user ignores notification:
  Transaction stays as unconfirmed in DB
  Badge count shown on Transactions tab
  At top of Transactions list: "2 pending SMS transactions"
  Tap → opens each one for completion
```

---

## 7. Edit Transaction Flow

```
Transaction Detail Modal → tap [Edit icon]
    ↓
Modal transforms into edit mode
(same form as Add, but pre-filled with existing data)

All fields editable
    ↓
[Save Changes]  [Cancel]
    ↓
Save → update DB → modal shows updated data
Cancel → revert to detail view, no changes
```

---

## 8. Budget Screen

```
Layout:
──────────────────────────────────────────────
[Header]
  "Budget"               [+ Add Budget]
  June 2026 (month selector)

[Budget Cards — one per category with a budget set]

┌───────────────────────────────────────────┐
│  🍔 Food                                  │
│  ₹8,200 spent of ₹10,000 limit           │
│  ₹1,800 remaining                 82%    │
│  [████████████████░░░░] ← amber (>80%)   │
└───────────────────────────────────────────┘

┌───────────────────────────────────────────┐
│  🚗 Transport                             │
│  ₹3,100 spent of ₹5,000 limit            │
│  ₹1,900 remaining                 62%    │
│  [████████████░░░░░░░░] ← green (<80%)   │
└───────────────────────────────────────────┘

┌───────────────────────────────────────────┐
│  🛍️ Shopping                              │
│  ₹6,200 spent of ₹5,000 limit            │
│  ₹1,200 over budget               124%   │  ← red card border
│  [████████████████████] ← red (exceeded) │
└───────────────────────────────────────────┘

[+ Add Budget for another category]

User Actions:
  Tap card         → Budget Detail (transactions in this category this month)
  Tap [+ Add]      → Add Budget Bottom Sheet
  Tap [Edit]       → Edit budget limit inline
  Long press card  → Edit / Delete options
```

### Add/Edit Budget Bottom Sheet
```
Category    [grid picker]
Month       [dropdown: Jan–Dec]
Year        [dropdown]
Limit (₹)   [number input]

[Save Budget]
```

### Budget Alert Notifications
```
Trigger 1: spending crosses 80% of limit
  Notification: "⚠️ Food budget at 82% — ₹1,800 left"

Trigger 2: spending exceeds limit
  Notification: "🔴 Shopping budget exceeded by ₹1,200"
  In-app: card border turns red, shake animation
```

---

## 9. Savings Goals Screen

```
Layout:
──────────────────────────────────────────────
[Header]
  "Goals"               [+ New Goal]

[Active Goals]

┌───────────────────────────────────────────┐
│  🎯 Save for Laptop                        │
│  Target    ₹1,00,000                      │
│  Saved     ₹35,000                        │
│  Remaining ₹65,000              35%       │
│  Deadline  Dec 2026                       │
│  [+ Add to Savings]                       │
└───────────────────────────────────────────┘

[Completed Goals] (collapsed section)
  Tap to expand → shows completed goals greyed out

User Actions:
  Tap [+ New Goal]      → Add Goal Bottom Sheet
  Tap goal card         → Goal Detail modal
  Tap [+ Add Savings]   → Update Saved Amount modal
  Long press            → Edit / Delete / Mark Complete
```

### Add Goal Bottom Sheet
```
Title         [text input]   "What are you saving for?"
Target (₹)    [number input]
Deadline      [date picker]  optional

[Create Goal]
```

### Update Saved Amount Modal
```
"How much have you added to this goal?"
Current saved: ₹35,000

[+ Add Amount]
  Input: ₹ [amount]
  New total will be: ₹XX,XXX

[Update]
```

---

## 10. Settings Screen

```
Layout:
──────────────────────────────────────────────
[Header]
  "Settings"

[Profile Section]
┌───────────────────────────────────────────┐
│  [Avatar]  Fawzaan                        │
│            Tap to edit profile            │
└───────────────────────────────────────────┘

[Preferences]
  Salary Date         5th of every month  →
  Salary Amount       ₹52,000             →
  Currency            ₹ (Indian Rupee)    →

[Categories]
  Manage Categories                        →
  (add, edit, reorder, delete custom ones)

[Security]
  App Lock            [toggle ON/OFF]
  Change Backup Password                   →

[Backup & Restore]
  Last Backup         Today, 10:00 AM
  Backup Now                               →
  Share Backup                             →
  Restore from Backup                      →

[About]
  App Version         1.0.0
```

### Edit Profile Screen
```
[Avatar — tap to change photo or clear]
Name          [text input, pre-filled]
              [Save]
```

### Manage Categories Screen
```
[Header] "Categories"    [+ Add Category]

Default Categories (cannot delete, can edit icon/color):
  🍔 Food         [edit]
  🚗 Transport    [edit]
  ...

My Categories:
  [user-created categories, can delete]
  + Add Category

Add/Edit Category Bottom Sheet:
  Name    [text input]
  Icon    [emoji picker grid]
  Color   [color swatch picker]
  Type    Expense | Income | Both

  [Save Category]
```

### Backup Now Flow
```
Tap "Backup Now"
    ↓
Loading indicator
    ↓
Fetch all DB data
    ↓
Serialize + encrypt with backup password
    ↓
Write to /Downloads/expense-backup.json
    ↓
Toast: "Backup saved to Downloads ✓"
    ↓
Update "Last Backup" display
```

### Share Backup Flow
```
Tap "Share Backup"
    ↓
Backup Now executes first (ensure latest)
    ↓
expo-sharing opens native Android share sheet
    ↓
User picks: Google Drive / WhatsApp / Email / etc.
    ↓
File shared
```

### Restore Flow
```
Tap "Restore from Backup"
    ↓
Alert: "This will replace ALL existing data.
        This action cannot be undone. Continue?"
  Cancel → nothing
  Continue ↓
    ↓
File picker opens
User selects expense-backup.json
    ↓
"Enter your backup password"
  [password input]
  [Decrypt & Restore]
    ↓
  Wrong password → "Incorrect password. Try again."
  Correct ↓
    ↓
Validate JSON structure
    ↓
Clear all tables
    ↓
Re-insert all records
    ↓
Toast: "Data restored successfully ✓"
    ↓
App navigates to Dashboard, reloads
```

---

## 11. Navigation Summary

```
Tab 1 — Dashboard
  → Transaction Detail Modal (tap any recent item)
  → Transactions Tab (tap "See all")

Tab 2 — Transactions
  → Transaction Detail Modal (tap item)
  → Edit Transaction (from detail modal)
  → Filter Bottom Sheet (tap filter icon)
  → Search inline (tap search icon)

FAB [+]
  → Add Transaction Bottom Sheet

Tab 3 — Budget
  → Add Budget Bottom Sheet
  → Budget Detail (tap card)

Tab 4 — Goals
  → Add Goal Bottom Sheet
  → Goal Detail Modal
  → Update Saved Amount Modal

Tab 5 — Settings
  → Edit Profile Screen
  → Manage Categories Screen
  → Change Password Screen
  → Backup/Restore actions (in-screen)

SMS Notification
  → Add Transaction Bottom Sheet (pre-filled)

Onboarding (first launch only)
  → 6 screens → Dashboard
```

---

## 12. Error & Edge Case States

| State | UI Response |
|---|---|
| No transactions yet | Empty state illustration + "Add your first transaction" CTA |
| No budget set | "No budgets yet" + "Set a budget" CTA |
| No goals set | "No goals yet" + "Create a goal" CTA |
| Delete transaction | Confirmation alert before delete |
| Restore — wrong password | Inline error under input, shake animation |
| Backup write fails | Toast: "Backup failed. Check storage permissions." |
| SMS permission denied | Manual-only mode, no auto-parse, prompt in settings |
| Biometric fails | Fallback to PIN automatically |
| Amount = 0 on save | Field shake + red border + error text |
| Required field empty | Field shake + red border + "This field is required" |
| Unconfirmed SMS transactions | Badge on Transactions tab + banner at top of list |
