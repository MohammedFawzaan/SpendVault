# UX App Flow
## SpendVault — Comprehensive Personal Finance Tracker — Android App

---

## Flow Overview

```
App Launch
    |
    v
First time?
  Yes -> Onboarding Flow (5 screens)
  No  -> App Lock Screen
              |
              v
         Authentication
              |
              v
         Main App (4 Tabs)
    +--------+----------+---------+
  Home  Transactions  Budget+Goals  Profile
    +--------+----------+---------+
                  |
            FAB [+] (Home, Transactions, Budget+Goals tabs)
```

---

## 1. First Launch — Onboarding Flow

Triggered once — when app is opened for the very first time.

```
Screen 1 — Splash Screen
─────────────────────────
App logo + name "SpendVault"
Tagline: "Your complete money story"
Auto-transitions to Screen 2 after 2 seconds

Screen 2 — Profile Setup
──────────────────────────
[Avatar picker — tap to set photo, or skip for auto initials]

Input: Username (required)         "What should we call you?"
Input: Date of Birth (optional)    date picker
Input: Occupation (optional)       "e.g. Software Engineer"

CTA: "Continue"
    |
    v

Screen 3 — Security Setup
───────────────────────────
[Fingerprint icon]
"Secure SpendVault"
"App lock is required — your data stays private"

CTA: "Set Up Biometric"   -> triggers biometric enrollment
  If biometric unavailable or skipped:
     -> PIN setup screen (4-6 digit PIN, confirm PIN)

App lock is mandatory — user cannot skip this screen entirely.
They must set up either biometric or PIN.
    |
    v

Screen 4 — SMS Permission
──────────────────────────
[SMS icon]
"Auto-detect your transactions"
"SpendVault reads your bank SMS to log transactions automatically"
"Your messages never leave your device"

CTA: "Allow SMS Access"   -> triggers READ_SMS system permission prompt
Link: "Skip for now"      -> manual-only mode (can enable later in Settings)
    |
    v

Screen 5 — All Set
───────────────────
[Success checkmark animation]
"You're all set, [Username]!"
"Start tracking your money"

CTA: "Go to Home"
    |
    v

Tab 1 — Home (Dashboard)
```

### Data Saved During Onboarding
```
user_profile table:
  username       -> from Screen 2
  avatar         -> from Screen 2 (local file path or null)
  date_of_birth  -> from Screen 2 (optional)
  occupation     -> from Screen 2 (optional)

config table:
  onboarding_complete    -> true
  sms_permission_granted -> true or false
```

---

## 2. App Launch Flow (After Onboarding)

```
App opens
    |
    v
Is onboarding complete?
  No  -> Onboarding Screen 1
  Yes -> App Lock Screen

App Lock Screen
  [SpendVault logo]
  [Fingerprint icon]
  "Tap to unlock"
  Biometric prompt fires automatically
    |
    v
  Biometric success -> Main App
  Biometric fail    -> "Try again" or "Use PIN"
                         |
                         v
                    PIN entry (4-6 digit)
                         |
                    Correct -> Main App
                    Wrong   -> shake animation + "Incorrect PIN" + retry

Main App loads:
  Check: today's date at 12:00 AM -> daily backup fires in background
  Check: unconfirmed SMS transactions?
    Yes -> badge shown on Transactions tab
    No  -> nothing
```

---

## 3. Home Screen (Dashboard — Tab 1)

```
Arrival animation:
  Screen fades in + slides up
  Cards appear with stagger delay
  Numbers count up from 0 to actual value (800ms)

Layout top to bottom:
───────────────────────────────────────────────

[Header]
  "Good morning, [Username]"       [Avatar circle]
  June 2026

[This Month Card]
  Income      52,000  (green)
  Expenses    31,400  (red)
  ────────────────────────────
  Savings     20,600  (39%)

[Two smaller cards side by side]
  [Lent pending: 2,500]    [Borrowed pending: 1,000]

[Recent Transactions — last 10]
  Section header: "RECENT"
  Transaction list items
  "See all" link -> Transactions tab

User Actions:
  Tap transaction item   -> Transaction Detail Modal
  Tap "See all"          -> Transactions tab
  Tap avatar             -> Profile tab
  Pull to refresh        -> recalculate totals
  Tap FAB [+]            -> Add Transaction Modal
```

---

## 4. Transactions Screen (Tab 2)

```
Layout:
───────────────────────────────────────────────
[Header]
  "Transactions"        [Filter icon]  [Search icon]

[Month/Year Selector]
  <- June 2026 ->
  Tap arrows or swipe to change month

[Summary Row]
  Income 52,000     Expenses 31,400

[Filter Chips — horizontal scroll]
  All | Debit | Credit | Cash | UPI | Card | Bank Transfer

[Transaction List — grouped by date]
  TODAY
  +────────────────────────────────────+
  | food icon  Swiggy        -450      |
  | Food · UPI · 2:30 PM               |
  +────────────────────────────────────+

  YESTERDAY
  +────────────────────────────────────+
  | money icon  Managix    +52,000     |
  | Income · Bank · 5 Jun              |
  +────────────────────────────────────+

  [Load all on scroll]

User Actions:
  Tap item               -> Transaction Detail Modal
  Swipe left on item     -> red Delete button revealed
    Tap Delete           -> Confirmation alert:
                           "Delete this transaction? This cannot be undone."
                           Confirm -> item removed with spring animation
                           Cancel  -> snaps back
  Tap filter icon        -> Filter Bottom Sheet
  Tap search icon        -> search bar appears inline
  Type in search         -> live filter by who / what / note
  Tap month arrows       -> animate month change, reload list
  Tap FAB [+]            -> Add Transaction Modal
  Badge on tab icon      -> unconfirmed SMS transactions pending
```

### Filter Bottom Sheet
```
Opens with spring animation from bottom
Drag handle at top

Filters:
  Type:    All | Debit | Credit
  Nature:  All | Income | Expense | Lent | Borrowed | Repayment | Pass-through
  Category: grid of category pills
  Method:  All | Cash | UPI | Card | Bank Transfer
  Paid For: All | Myself | [names from data]
  Year:    dropdown

[Clear All]    [Apply Filters]

Apply -> sheet closes, list filters with animation
```

### Transaction Detail Modal
```
Opens as bottom sheet

[Type badge]  [Nature badge]          [Edit icon]

Amount
450  (red for debit / green for credit)

──────────────────────────────────────
Who           Swiggy
What          Dinner order
When          27 Jun 2026, 2:30 PM
Where         Online
Why           Hungry at work
How           UPI
Category      Food
Paid For      Myself
Note          Butter chicken + naan
UPI Ref       412345678901
Source        SMS auto-parsed

──────────────────────────────────────
[Edit Transaction]          [Delete]
```

---

## 5. Add Transaction Flow (FAB [+])

```
Tap FAB [+]
    |
    v
Add Transaction Bottom Sheet springs up from bottom

Step 1 — Type Selection
  [DEBIT]    [CREDIT]    <- toggle, tap to switch
  Debit selected by default

Step 2 — Amount
  Rupee symbol [   0   ]
  Large centered input, numpad auto-opens, auto-focused

Step 3 — Nature (scrollable pills based on type)
  If Debit:   Expense | Lent | Repayment Made | Pass-through
  If Credit:  Income  | Borrowed | Repayment Received | Pass-through

Step 4 — Full Story Form
  Who *         text input     "Person or merchant name"
  What *        text input     "What was this for?"
  Category *    grid picker    category icons and names
  How *         pill select    Cash | UPI | Card | Bank Transfer
  Date/Time     date picker    default: now
  Where         text input     optional
  Why           text input     optional
  Paid For      text input     optional, null = myself
  Note          text input     optional

  * required fields

[Save Transaction]  <- primary button, full width

Validation:
  Amount = 0 or empty    -> shake + red border + "Enter an amount"
  Required field empty   -> shake + red border + "This field is required"

On Save:
  Button shows loading briefly
      |
  Write to SQLite (INSERT)
      |
  Trigger backup check (is it past midnight? -> if not, skip)
      |
  Bottom sheet slides down
      |
  New card springs into transaction list
      |
  Dashboard totals update
      |
  Toast: "Transaction saved"
```

---

## 6. Edit Transaction Flow

```
Transaction Detail Modal -> tap Edit icon
    |
    v
Modal transforms to edit mode
Same form as Add, pre-filled with existing data
All fields editable

[Save Changes]    [Cancel]

Save    -> UPDATE in SQLite -> modal shows updated data -> toast "Updated"
Cancel  -> revert to detail view, no changes
```

---

## 7. Delete Transaction Flow

```
Option A — from Transaction List:
  Swipe left on transaction card
      |
  Red "Delete" button revealed
      |
  Tap Delete
      |
  Alert: "Delete this transaction? This cannot be undone."
  Confirm -> DELETE from SQLite -> spring remove from list
  Cancel  -> card snaps back

Option B — from Transaction Detail Modal:
  Tap [Delete] button at bottom
      |
  Same alert shown
  Confirm -> DELETE -> modal closes -> removed from list
```

---

## 8. SMS Auto-Parse Flow

```
Bank SMS received on phone
    |
    v
react-native-get-sms-android intercepts
    |
    v
Known bank sender? -> No -> ignore
                  -> Yes -> parse with regex
                              |
                              v
                         Extract: amount, type, upi_ref, datetime
                              |
                              v
                         INSERT unconfirmed transaction (confirmed = 0)
                              |
                              v
                         Push notification:
                         "500 debited detected — tap to complete"

User taps notification
    |
    v
App opens (auth required first if locked)
    |
    v
SMS Transaction Modal opens:
  Pre-filled:
    Amount   -> from SMS
    Type     -> from SMS
    Date     -> from SMS
    UPI Ref  -> from SMS
    Source   -> "sms" badge shown

  User fills:
    Who, What, Nature, Category, Where, Why, Paid For, Note

  [Save Transaction]
    |
  Transaction confirmed (confirmed = 1)
    |
  Notification dismissed

If user ignores notification:
  Transaction stays as unconfirmed
  Badge count shown on Transactions tab
  Banner at top of list: "2 pending SMS transactions — tap to complete"
```

---

## 9. Budget & Goals Screen (Tab 3)

```
Layout — two sections on one screen, scrollable:
───────────────────────────────────────────────

Section Header: "BUDGET"
[+ Add Budget]

Budget Cards:
+──────────────────────────────────────────+
|  Food                                    |
|  8,200 spent of 10,000 limit             |
|  1,800 remaining               82%       |  <- amber warning
+──────────────────────────────────────────+

+──────────────────────────────────────────+
|  Shopping                                |
|  6,200 spent of 5,000 limit              |
|  1,200 over budget             124%      |  <- red exceeded
+──────────────────────────────────────────+

─────────────────────────────────────────────

Section Header: "GOALS"
[+ Add Goal]

Goal Cards:
+──────────────────────────────────────────+
|  Save for Laptop                         |
|  Target    1,00,000                      |
|  Saved        35,000                     |
|  Remaining    65,000           35%       |
|  Deadline  Dec 2026                      |
|  [+ Add to Savings]                      |
+──────────────────────────────────────────+

User Actions:
  Tap budget card        -> Budget Detail (transactions in that category this month)
  Tap [+ Add Budget]     -> Add Budget Bottom Sheet
  Long press budget      -> Edit / Delete options
  Tap goal card          -> Goal Detail Modal
  Tap [+ Add Goal]       -> Add Goal Bottom Sheet
  Tap [+ Add to Savings] -> Update Saved Amount Modal
  Long press goal        -> Edit / Mark Complete / Delete options
  Tap FAB [+]            -> Add Transaction Modal
```

### Add/Edit Budget Bottom Sheet
```
Category     grid picker
Month        dropdown Jan-Dec
Year         dropdown
Limit        number input

[Save Budget]
```

### Add/Edit Goal Bottom Sheet
```
Title        text input    "What are you saving for?"
Target       number input
Deadline     date picker   optional

[Create Goal]
```

### Update Saved Amount Modal
```
"How much have you added to this goal?"
Current saved: 35,000
Input: amount to add
New total preview: XX,XXX

[Update]
```

### Budget Alert Notifications
```
At 80% of limit:
  Notification: "Food budget at 82% — 1,800 remaining this month"

At 100%+ of limit:
  Notification: "Shopping budget exceeded by 1,200"
  In-app: card border turns red, number turns red
```

---

## 10. Profile Screen (Tab 4)

```
Layout:
───────────────────────────────────────────────
[Large Avatar — photo or initials circle]
[Username]
[Occupation]

──────────────────────────────────────────────
Real-time clock:  Saturday, 27 June 2026  2:45 PM
(updates every minute)

──────────────────────────────────────────────
[This Month Card]
  Last Salary       52,000  (credited 5 Jun)
  Total Budget      20,000
  Total Spent       15,200
  Remaining          4,800

──────────────────────────────────────────────
[Settings Button]  -> navigates to Settings Screen

User Actions:
  Tap avatar         -> open image picker to change photo
  Tap Settings btn   -> Settings Screen
```

---

## 11. Settings Screen (accessed from Profile tab)

```
Layout:
───────────────────────────────────────────────
[Back arrow]  "Settings"

[Profile Section]
  Avatar            [tap to change]
  Username          [editable field]
  Date of Birth     [date picker]
  Occupation        [editable field]
  [Save Profile]

[Preferences]
  Currency          Indian Rupee (non-editable for now)

[Security]
  App Lock          Biometric / PIN  (mandatory — shows info only, no toggle)

[Categories]
  Manage Categories ->  (opens category management screen)

[Backup & Restore]
  Last Backup       Today, 12:00 AM
  Backup Now        [tap to backup manually]
  Share Backup      [tap to open share sheet]
  Restore from Backup [tap to restore]

Category Management Screen:
  Default categories listed (editable icon/color, not deletable)
  User categories listed (fully editable and deletable)
  [+ Add Category] button

  Add/Edit Category Bottom Sheet:
    Name    text input
    Icon    emoji picker grid
    Color   color swatch picker
    Type    Expense | Income | Both
    [Save Category]
```

---

## 12. Backup Flow (Auto at 12:00 AM)

```
expo-background-fetch fires at 12:00 AM
    |
    v
Fetch all records: user_profile, transactions, categories,
                   budgets, savings_goals, config
    |
    v
Serialize to plain JSON
    |
    v
Write to /Downloads/expense-backup.json (overwrite)
    |
    v
Update config: last_backup_at = now()
    |
    v
Silent — no UI shown (user is likely asleep)
```

### Manual Backup Flow
```
Tap "Backup Now" in Settings
    |
    v
Same backup process runs
    |
    v
Toast: "Backup saved to Downloads"
    |
    v
"Last Backup" updates in Settings
```

### Share Backup Flow
```
Tap "Share Backup"
    |
    v
Backup runs first (ensure latest)
    |
    v
expo-sharing opens native Android share sheet
    |
    v
User picks: Google Drive / WhatsApp / Email / etc.
```

---

## 13. Restore Flow

```
Tap "Restore from Backup"
    |
    v
Alert: "This will replace ALL your data. This cannot be undone. Continue?"
  Cancel -> nothing
  Continue ->
      |
      v
File picker opens
User selects expense-backup.json
      |
      v
Validation runs:
  Is valid JSON?                  -> fail: "Invalid file format"
  Has version key?                -> fail: "Not a SpendVault backup file"
  Version compatible?             -> fail: "Backup version not supported"
  Has required data keys?         -> fail: "Backup file is incomplete or corrupted"
  All pass ->
      |
      v
Confirmation: "Restore will replace all data with backup from [date]. Proceed?"
      |
      v
Clear all tables
Re-insert all records from JSON
      |
      v
Toast: "Data restored successfully"
      |
      v
App navigates to Home tab, full reload
```

---

## 14. Navigation Summary

```
App Lock Screen (public)
    |
    v (authenticate)
Tab 1 — Home
  -> Transaction Detail Modal
  -> Transactions Tab (see all)
  -> FAB [+] -> Add Transaction Modal

Tab 2 — Transactions
  -> Transaction Detail Modal
     -> Edit Modal
     -> Delete Alert
  -> Filter Bottom Sheet
  -> Inline Search
  -> SMS Transaction Modal (from notification)
  -> FAB [+] -> Add Transaction Modal

Tab 3 — Budget & Goals
  -> Add/Edit Budget Bottom Sheet
  -> Budget Detail Screen
  -> Add/Edit Goal Bottom Sheet
  -> Goal Detail Modal
  -> Update Saved Amount Modal
  -> FAB [+] -> Add Transaction Modal

Tab 4 — Profile
  -> Settings Screen
     -> Category Management Screen
     -> Backup/Restore actions

Onboarding (first launch only — 5 screens -> Home)
```

---

## 15. Error & Edge Case States

| State | UI Response |
|---|---|
| No transactions yet | Empty state with illustration + "Add your first transaction" CTA |
| No budget set | Empty state + "Set a budget" CTA |
| No goals yet | Empty state + "Create your first goal" CTA |
| Delete transaction | Confirmation alert required before delete |
| Restore — invalid JSON | Error toast, restore aborted, data untouched |
| Restore — wrong version | Error toast, restore aborted, data untouched |
| Restore — incomplete file | Error toast, restore aborted, data untouched |
| Backup write fails | Toast: "Backup failed. Check storage permissions." |
| SMS permission denied | Manual-only mode, prompt to enable in Settings |
| Biometric fails | Auto fallback to PIN |
| Amount = 0 on save | Field shake + red border + "Enter an amount" |
| Required field empty | Field shake + red border + "This field is required" |
| Unconfirmed SMS pending | Badge on Transactions tab + banner at top of list |
| Budget at 80% | Push notification warning |
| Budget exceeded | Push notification + red card border in UI |