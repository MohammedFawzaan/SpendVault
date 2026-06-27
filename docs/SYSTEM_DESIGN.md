# System Design & Technical Stack
## SpendVault — Comprehensive Personal Finance Tracker — Android App

---

## 1. Architecture Philosophy

- Offline-first — all data lives on device, no network dependency
- Single user, single device — no auth system, no sync, no server
- SMS-driven automation — transactions auto-detected from bank SMS
- Manual entry always available — every transaction can be added manually
- APK distributable — any Android device can install and run independently

---

## 2. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | React Native + Expo | Cross-platform, familiar stack |
| Design Framework | NativeWind (Tailwind for RN) | Utility-first styling, fast UI development |
| Language | TypeScript | Type safety, familiar from existing stack |
| Navigation | Expo Router | File-based routing, clean screen management |
| Database | expo-sqlite | Offline, on-device, relational |
| ORM | Drizzle ORM | Type-safe queries, schema migrations |
| SMS Reading | react-native-get-sms-android | READ_SMS permission, background listener |
| Biometric Auth | expo-local-authentication | Fingerprint, face, PIN fallback |
| File System | expo-file-system | Read/write JSON backup to device Downloads |
| File Sharing | expo-sharing | Native Android share sheet |
| Notifications | expo-notifications | Budget limit alerts, SMS detection alerts |
| Background Tasks | expo-background-fetch + expo-task-manager | 12:00 AM daily backup |
| Animations | react-native-reanimated | Smooth transitions and interactions |

---

## 3. High-Level Architecture

```
+----------------------------------------------+
|              App Lock Layer                   |
|    Biometric / PIN (expo-local-auth)          |
|  App blocked until authentication passes      |
+--------------------+--------------------------+
                     |
                     v
+----------------------------------------------+
|              App Screens (4 Tabs)            |
|  Home | Transactions | Budget+Goals | Profile |
|              Settings Screen                  |
+----------+-----------------------------------+
           |
           v
+----------------------------------------------+
|           Business Logic Layer               |
|                                              |
|  Transaction Manager    SMS Parser           |
|  Budget Manager         Backup Manager       |
|  Goal Manager           Notification Service |
+----------+------------------+---------------+
           |                  |
           v                  v
+------------------+  +------------------------+
|   SQLite DB      |  |  expo-file-system      |
|  (expo-sqlite    |  |  expense-backup.json   |
|  + Drizzle ORM)  |  |  /Downloads/           |
|  App internal    |  +----------+-------------+
|  private storage |             |
+------------------+             v
                      +------------------------+
                      |  expo-sharing          |
                      |  Native Share Sheet    |
                      |  Google Drive          |
                      |  WhatsApp / Email      |
                      +------------------------+
```

---

## 4. SMS Auto-Parsing Flow

```
Bank sends SMS after any transaction
            |
            v
react-native-get-sms-android (READ_SMS permission granted)
            |
            v
Incoming SMS captured in background
            |
            v
Is sender a known bank sender ID?
            |
           Yes
            |
            v
Run regex engine — extract fields:
  Amount      ->  Rs\.?(\d+(?:\.\d+)?)
  Type        ->  'debited' | 'credited'
  UPI Ref     ->  UPI Ref:? ?(\d+)
  Account     ->  A\/c .*?(\d{4})
  Date/Time   ->  from SMS timestamp
            |
            v
Create unconfirmed transaction in DB
(source = 'sms', confirmed = 0)
            |
            v
Push notification to user:
"New transaction detected — 500 debited. Tap to complete."
            |
            v
User taps notification — modal opens with pre-filled fields
            |
            v
User fills: who, what, category, nature, where, why, note
            |
            v
Transaction saved as confirmed (confirmed = 1)
```

### Supported SMS Patterns
- UPI debit / credit (all major banks)
- Card swipe (POS transactions)
- ATM withdrawal
- Bank transfer (NEFT/IMPS/RTGS)
- Cashback / refund credits

---

## 5. Backup & Restore Flow

### Backup Triggers
```
Trigger 1 — Daily at 12:00 AM
  expo-background-fetch fires at midnight
  Backup runs silently in background

Trigger 2 — Manual
  User taps "Backup Now" in Settings
  Backup runs with confirmation toast on completion
```

### Backup Flow
```
Backup triggered
      |
      v
Fetch all records from:
  user_profile, transactions, categories,
  budgets, savings_goals, config
      |
      v
Serialize to plain JSON:
{
  "version": "1.0",
  "exported_at": "2026-06-27T00:00:00Z",
  "data": {
    "user_profile": {...},
    "transactions": [...],
    "categories": [...],
    "budgets": [...],
    "savings_goals": [...],
    "config": [...]
  }
}
      |
      v
Write to /Downloads/expense-backup.json
(overwrites previous file)
      |
      v
Update config: last_backup_at = now()
      |
      v
Toast: "Backup saved successfully"
```

### Restore Flow
```
User taps "Restore from Backup"
      |
      v
File picker opens — user selects JSON file
      |
      v
Validation runs:
  - Is it valid JSON?
  - Does it have required top-level keys?
  - Is app version compatible?
      |
      |-- Validation FAILS
      |     Show error: "Invalid or incompatible backup file"
      |     Restore aborted — existing data untouched
      |
      |-- Validation PASSES
            |
            v
      Confirmation prompt:
      "This will replace ALL existing data. Continue?"
            |
            v
      Clear all existing tables
            |
            v
      Re-insert all records from JSON
            |
            v
      Toast: "Data restored successfully"
            |
            v
      App reloads to Dashboard
```

### Phone Migration Flow
```
Old Phone:
  Settings > Backup Now > Share > Google Drive / WhatsApp / Email

New Phone:
  Install APK
  Complete onboarding (profile + security)
  Settings > Restore from Backup
  Select JSON file
  Validation passes > data fully restored
```

---

## 6. Security Architecture

### App Lock (Only Security Layer)
```
App opens
    |
    v
expo-local-authentication
    |
    v
Biometric available?
  Yes -> Fingerprint / Face prompt fires automatically
  No  -> PIN prompt shown
    |
    v
Authentication passes -> app unlocks, all screens accessible
Authentication fails  -> app stays on lock screen
```

- App lock is mandatory — no toggle to disable
- Lock screen is the only public screen
- Every other screen requires authentication
- No database encryption (removed)
- No backup file encryption (plain JSON)

---

## 7. Distribution Model

```
Developer builds APK (EAS Build — cloud build)
        |
        v
APK downloaded and shared via WhatsApp / Drive
        |
        v
User installs on Android device
        |
        v
App creates its own isolated SQLite DB in app private storage
        |
        v
Person A's phone  ->  Person A's private database
Person B's phone  ->  Person B's private database
                  (zero connection between them)
```

- No server involvement at any point
- Same APK on multiple phones = fully independent isolated instances
- App private storage is not accessible by other apps without root

---

## 8. Storage Locations

| Data | Location | Accessible By |
|---|---|---|
| SQLite .db file | App internal private storage (/data/data/com.spendvault/databases/) | App only |
| JSON backup | Device Downloads folder (/Downloads/expense-backup.json) | User, file managers, sharing |

The SQLite database lives in the app's private internal storage — invisible to other apps and file managers. The JSON backup is intentionally saved to the Downloads folder so the user can access, share, and manage it freely.

---

## 9. Folder Structure

```
SpendVault/
├── app/                            # Expo Router screens
│   ├── index.tsx                   # Lock / Auth screen (public)
│   ├── onboarding/
│   │   ├── splash.tsx
│   │   ├── profile.tsx
│   │   ├── security.tsx
│   │   ├── sms-permission.tsx
│   │   └── all-set.tsx
│   ├── (tabs)/
│   │   ├── index.tsx               # Tab 1 — Home (Dashboard)
│   │   ├── transactions.tsx        # Tab 2 — Transactions
│   │   ├── budget-goals.tsx        # Tab 3 — Budget & Goals
│   │   └── profile.tsx             # Tab 4 — Profile
│   ├── settings.tsx                # Settings screen (from Profile tab)
│   └── _layout.tsx                 # Root layout with auth gate
│
├── components/
│   ├── TransactionCard.tsx
│   ├── AddTransactionModal.tsx
│   ├── EditTransactionModal.tsx
│   ├── SMSTransactionModal.tsx
│   ├── BudgetItem.tsx
│   ├── GoalCard.tsx
│   └── DeleteConfirmAlert.tsx
│
├── db/
│   ├── schema.ts                   # Drizzle schema — all 6 tables
│   ├── migrations/                 # Auto-generated Drizzle migrations
│   ├── queries/
│   │   ├── transactions.ts         # create, edit, delete, filter queries
│   │   ├── budgets.ts
│   │   ├── goals.ts
│   │   ├── userProfile.ts
│   │   └── config.ts
│   └── index.ts                    # DB connection setup
│
├── services/
│   ├── smsParser.ts                # SMS regex engine
│   ├── backupService.ts            # Backup and restore logic + validation
│   ├── authService.ts              # Biometric / PIN auth
│   └── notificationService.ts     # Budget alerts, SMS detection alerts
│
├── hooks/
│   ├── useTransactions.ts
│   ├── useBudget.ts
│   ├── useGoals.ts
│   └── useBackup.ts
│
├── constants/
│   ├── categories.ts               # Default seeded categories
│   ├── smsPatterns.ts              # Bank SMS regex patterns
│   └── natures.ts                  # Transaction nature definitions
│
└── utils/
    ├── currency.ts                 # Rupee formatting
    ├── date.ts                     # Date and time helpers
    └── validation.ts               # Backup JSON validation logic
```

---

## 10. Key Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| Local vs Cloud DB | Local SQLite | Offline-first, single user, no infra needed |
| ORM | Drizzle ORM | Type-safe, migrations, TypeScript native |
| Styling | NativeWind (Tailwind) | Fast UI development, utility-first |
| Backup format | Plain JSON | Human-readable, easy to restore, universal |
| Backup trigger | 12:00 AM daily + manual | Reliable, predictable, not performance-heavy |
| Backup on every write | No | Performance concern at scale |
| DB encryption | No (SQLCipher removed) | Unnecessary for single-user local app |
| Backup encryption | No (plain JSON) | Simplicity; user manages file security |
| App lock | Mandatory, always on | Security without complexity |
| iOS support | No | READ_SMS not available on iOS |
| Charts / analytics | No | Out of product scope |
| Reports | No | Out of product scope |
| Tab count | 4 tabs | Home, Transactions, Budget+Goals, Profile |