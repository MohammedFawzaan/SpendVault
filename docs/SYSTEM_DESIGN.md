# System Design & Technical Stack
## Comprehensive Personal Finance Tracker — Android App

---

## 1. Architecture Philosophy

- **Offline-first** — all data lives on device, no network dependency
- **Single user, single device** — no auth, no sync, no server
- **SMS-driven automation** — transactions auto-detected from bank SMS
- **Encrypted at rest** — database and backup both encrypted
- **APK distributable** — any Android device can install and run independently

---

## 2. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | React Native + Expo | Cross-platform, familiar stack |
| Language | TypeScript | Type safety, familiar from existing stack |
| Navigation | Expo Router | File-based routing, clean screen management |
| Database | expo-sqlite | Offline, on-device, relational |
| ORM | Drizzle ORM | Type-safe queries, schema migrations |
| DB Encryption | SQLCipher | Encrypts SQLite file at rest |
| SMS Reading | react-native-get-sms-android | READ_SMS permission, background listener |
| Biometric Auth | expo-local-authentication | Fingerprint, face, PIN fallback |
| File System | expo-file-system | Read/write JSON backup to device storage |
| File Sharing | expo-sharing | Native Android share sheet |
| Notifications | expo-notifications | Budget limit alerts, salary reminders |

---

## 3. High-Level Architecture

```
┌──────────────────────────────────────────────┐
│               App Lock Layer                  │
│       Biometric / PIN (expo-local-auth)       │
│     App blocked until authentication passes   │
└────────────────────┬─────────────────────────┘
                     ↓
┌──────────────────────────────────────────────┐
│                 App Screens                   │
│   Dashboard │ Transactions │ Budget │ Goals  │
│                  Settings                     │
└───────────┬──────────────────────────────────┘
            ↓
┌──────────────────────────────────────────────┐
│              Business Logic Layer             │
│                                               │
│  ┌─────────────────┐  ┌────────────────────┐ │
│  │   Transaction   │  │    SMS Parser      │ │
│  │    Manager      │  │  (regex engine)    │ │
│  └────────┬────────┘  └────────┬───────────┘ │
│           │                    │              │
│  ┌────────┴────────┐  ┌────────┴───────────┐ │
│  │ Budget Manager  │  │   Backup Manager   │ │
│  └────────┬────────┘  └────────┬───────────┘ │
└───────────┼────────────────────┼─────────────┘
            ↓                    ↓
┌──────────────────┐  ┌─────────────────────────┐
│  SQLCipher       │  │  expo-file-system        │
│  Encrypted       │  │  expense-backup.json     │
│  SQLite DB       │  │  /Downloads/             │
└──────────────────┘  └────────┬────────────────┘
                               ↓
                  ┌────────────────────────┐
                  │  expo-sharing          │
                  │  Native Share Sheet    │
                  │  → Google Drive        │
                  │  → WhatsApp            │
                  │  → Email               │
                  └────────────────────────┘
```

---

## 4. SMS Auto-Parsing Flow

```
Bank sends SMS after any transaction
            ↓
react-native-get-sms-android
    (READ_SMS permission granted)
            ↓
Incoming SMS captured in background
            ↓
Is sender a bank? (check against known bank sender IDs)
            ↓
         Yes → Run regex engine
            ↓
   Extract fields:
   - Amount      → Rs\. ?(\d+(?:\.\d+)?)
   - Type        → 'debited' | 'credited'
   - UPI Ref     → UPI Ref:? ?(\d+)
   - Account     → A\/c .*?(\d{4})
   - Date/Time   → from SMS timestamp
            ↓
Create unconfirmed transaction in DB
(source = 'sms', confirmed = false)
            ↓
Push notification to user
"New transaction detected — ₹500 debited. Tap to complete."
            ↓
User taps → opens modal with pre-filled fields
            ↓
User fills: who, what, category, nature, note
            ↓
Transaction saved as confirmed ✅
```

### Supported SMS Patterns
- UPI debit / credit (all major banks)
- Card swipe (POS transactions)
- ATM withdrawal
- Bank transfer (NEFT/IMPS/RTGS)
- Cashback / refund credits

---

## 5. Backup & Restore Flow

### Auto-Backup Triggers
```
1. App opened → check last_backup_at from config table
   → if more than 24 hours ago → trigger backup silently

2. App goes to background (AppState = 'background')
   → trigger backup silently

3. User taps "Backup Now" in settings
   → trigger backup with confirmation toast
```

### Backup Flow
```
Trigger backup
      ↓
Fetch all records from:
  - transactions
  - categories
  - budgets
  - savings_goals
  - config
      ↓
Serialize to JSON:
{
  "version": "1.0",
  "exported_at": "2026-06-27T10:00:00Z",
  "data": {
    "transactions": [...],
    "categories": [...],
    "budgets": [...],
    "savings_goals": [...],
    "config": [...]
  }
}
      ↓
Encrypt JSON with user-set password
      ↓
Write to /Downloads/expense-backup.json
(overwrite previous file)
      ↓
Update config: last_backup_at = now()
      ↓
Show toast: "Backup saved successfully"
```

### Restore Flow
```
User taps "Restore from Backup"
      ↓
File picker opens → user selects JSON file
      ↓
Confirmation prompt:
"This will replace ALL existing data. Continue?"
      ↓
User enters backup password → decrypt JSON
      ↓
Validate JSON structure and version
      ↓
Clear all existing tables
      ↓
Re-insert all records from JSON
      ↓
Show toast: "Data restored successfully"
      ↓
App reloads to Dashboard
```

### Phone Migration Flow
```
Old Phone:
  Settings → Backup Now → Share → Google Drive / WhatsApp

New Phone:
  Install APK
  Settings → Restore from Backup
  Select JSON file from Drive / WhatsApp
  Enter password → data restored ✅
```

---

## 6. Security Architecture

### Layer 1 — App Lock
```
App opens
    ↓
config: lock_enabled = true?
    ↓ Yes
expo-local-authentication
    ↓
Biometric available?
  Yes → Fingerprint / Face prompt
  No  → PIN prompt (fallback)
    ↓
Authentication passes → app unlocks
Authentication fails  → app stays locked
```

### Layer 2 — Database Encryption (SQLCipher)
- SQLite `.db` file is fully encrypted at rest
- Decrypted only in memory during app session
- Even if someone extracts the `.db` file from device storage, it is unreadable without the key
- Encryption key derived from device-specific identifier

### Layer 3 — Backup Encryption
- JSON backup file encrypted with user-set password
- Without the password, the backup file is unreadable
- User must remember this password for restoration

---

## 7. Distribution Model

```
Developer builds APK
        ↓
APK shared via WhatsApp / Google Drive / direct install
        ↓
User installs on Android device
        ↓
App creates its own isolated SQLite database on that device
        ↓
Person A's phone  →  Person A's database (private)
Person B's phone  →  Person B's database (private)
                  (zero connection between them)
```

- No server involvement at any point
- Naturally multi-user across devices — each user is isolated
- Installing same APK on multiple phones = fully independent instances

---

## 8. Folder Structure

```
expense-tracker/
├── app/                          # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx             # Dashboard
│   │   ├── transactions.tsx      # Transactions list
│   │   ├── budget.tsx            # Budget screen
│   │   ├── goals.tsx             # Savings goals
│   │   └── settings.tsx          # Settings
│   └── _layout.tsx               # Root layout with auth gate
│
├── components/                   # Reusable UI components
│   ├── TransactionCard.tsx
│   ├── AddTransactionModal.tsx
│   ├── BudgetItem.tsx
│   └── GoalCard.tsx
│
├── db/                           # Database layer
│   ├── schema.ts                 # Drizzle schema definitions
│   ├── migrations/               # Auto-generated migrations
│   ├── queries/
│   │   ├── transactions.ts
│   │   ├── budgets.ts
│   │   ├── goals.ts
│   │   └── config.ts
│   └── index.ts                  # DB connection setup
│
├── services/                     # Business logic
│   ├── smsParser.ts              # SMS regex + parsing logic
│   ├── backupService.ts          # Backup and restore logic
│   ├── authService.ts            # Biometric / PIN auth
│   └── notificationService.ts   # Budget alerts, reminders
│
├── hooks/                        # Custom React hooks
│   ├── useTransactions.ts
│   ├── useBudget.ts
│   └── useBackup.ts
│
├── constants/
│   ├── categories.ts             # Default categories
│   ├── smsPatterns.ts            # Bank SMS regex patterns
│   └── natures.ts                # Transaction nature definitions
│
└── utils/
    ├── currency.ts               # ₹ formatting
    ├── date.ts                   # Date helpers
    └── encryption.ts             # Backup encryption helpers
```

---

## 9. Key Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| Local vs Cloud DB | Local SQLite | Offline-first, single user, no infra |
| ORM | Drizzle | Type-safe, migrations, TypeScript native |
| Backup format | JSON | Human-readable, easy to restore, universal |
| Backup frequency | Daily + background | Balance between data safety and performance |
| Backup on every write | ❌ No | Performance concern at scale |
| iOS support | ❌ No | READ_SMS not available on iOS |
| Auth system | ❌ No | Single user, no login needed |
| Charts / analytics | ❌ No | Out of product scope |
| Reports | ❌ No | Out of product scope |
