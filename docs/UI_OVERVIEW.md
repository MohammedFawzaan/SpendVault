# UI Overview & Design System
## Comprehensive Personal Finance Tracker — Android App

---

## 1. Design Philosophy

- **Light, soothing, calm** — this app is opened multiple times a day; it must never feel harsh or heavy
- **Clean and minimal** — no clutter, every element earns its place
- **Finance-friendly** — green for money in, red for money out, universal and intuitive
- **Animated but not distracting** — smooth transitions that feel natural, not showy
- **Poppins everywhere** — single font family, consistent rhythm throughout

---

## 2. Color Palette

### Base Colors
| Role | Name | Hex | Usage |
|---|---|---|---|
| App Background | Warm White | `#F8F7F4` | All screen backgrounds |
| Surface | Pure White | `#FFFFFF` | Cards, modals, bottom sheets, tab bar |
| Primary | Sage Green | `#4CAF82` | Buttons, active icons, highlights, FAB |
| Primary Dark | Deep Green | `#2D7A5C` | Button pressed state, links |
| Primary Light | Mint | `#E8F5EE` | Pill badges for income, success banners |

### Semantic Colors
| Role | Name | Hex | Usage |
|---|---|---|---|
| Debit / Expense | Soft Red | `#FF6B6B` | Debit amounts, expense badges |
| Debit Light | Blush | `#FFF0F0` | Debit badge background |
| Credit / Income | Sage Green | `#4CAF82` | Credit amounts, income badges |
| Warning | Warm Amber | `#F4A261` | Budget nearing limit |
| Warning Light | Peach | `#FFF4ED` | Warning badge background |
| Danger | Deep Red | `#E53E3E` | Budget exceeded, delete actions |

### Text Colors
| Role | Hex | Usage |
|---|---|---|
| Text Primary | `#1A1A2E` | Headings, amounts, primary content |
| Text Secondary | `#6B7280` | Subtitles, meta info, labels |
| Text Tertiary | `#9CA3AF` | Hints, placeholders, disabled |
| Text Inverse | `#FFFFFF` | Text on colored backgrounds |

### Border & Divider
| Role | Hex | Usage |
|---|---|---|
| Border Default | `#E5E7EB` | Card borders, dividers, input borders |
| Border Focus | `#4CAF82` | Input focused state |
| Border Error | `#FF6B6B` | Input error state |

---

## 3. Typography — Poppins

Install: `expo-google-fonts/poppins`

```ts
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
```

### Type Scale

| Token | Weight | Size | Line Height | Usage |
|---|---|---|---|---|
| `display` | Bold 700 | 32px | 40px | Large amounts on dashboard |
| `h1` | Bold 700 | 24px | 32px | Screen titles |
| `h2` | SemiBold 600 | 20px | 28px | Section headings, card titles |
| `h3` | SemiBold 600 | 18px | 26px | Modal titles |
| `body1` | Medium 500 | 16px | 24px | Primary body text, list items |
| `body2` | Regular 400 | 14px | 22px | Secondary body, descriptions |
| `caption` | Regular 400 | 12px | 18px | Timestamps, hints, meta |
| `label` | SemiBold 600 | 12px | 18px | Badges, tags, pill labels |
| `button` | SemiBold 600 | 16px | 24px | All button text |
| `amount_large` | Bold 700 | 36px | 44px | Input amount field |
| `amount_medium` | Bold 700 | 20px | 28px | Transaction list amounts |

---

## 4. Spacing System

Base unit: `8px`. All spacing is a multiple of 8.

```
4px   → micro gaps (icon to text)
8px   → xs (tight inner padding)
12px  → sm (compact padding)
16px  → md (standard padding — most used)
24px  → lg (card padding, section gaps)
32px  → xl (screen top padding)
48px  → 2xl (large section separators)
```

### Screen Horizontal Padding
```
All screens → paddingHorizontal: 16px
```

---

## 5. Border Radius

```
4px   → tags, small chips
8px   → input fields, small buttons
12px  → buttons, list items
16px  → cards (main radius used throughout)
24px  → modals, bottom sheets
999px → pill badges, FAB button
```

---

## 6. Elevation & Shadows

Soft, barely-visible shadows. Nothing heavy.

```ts
// Card shadow (used on all white cards)
shadowColor: '#000000'
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.06
shadowRadius: 12
elevation: 3  // Android

// FAB shadow
shadowColor: '#4CAF82'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.3
shadowRadius: 12
elevation: 8

// Modal / Bottom sheet shadow
shadowColor: '#000000'
shadowOffset: { width: 0, height: -4 }
shadowOpacity: 0.08
shadowRadius: 16
elevation: 16
```

---

## 7. Component Design Specifications

### 7.1 Cards
```
Background      : #FFFFFF
Border radius   : 16px
Padding         : 16px
Shadow          : card shadow (see above)
Margin bottom   : 12px
```

### 7.2 Buttons

**Primary Button** (Sage Green filled)
```
Background      : #4CAF82
Text            : #FFFFFF, Poppins SemiBold 16px
Border radius   : 12px
Height          : 52px
Pressed state   : background #2D7A5C, scale 0.97
```

**Secondary Button** (Outlined)
```
Background      : transparent
Border          : 1.5px solid #4CAF82
Text            : #4CAF82, Poppins SemiBold 16px
Border radius   : 12px
Height          : 52px
Pressed state   : background #E8F5EE
```

**Danger Button** (For delete actions)
```
Background      : #FFF0F0
Text            : #E53E3E, Poppins SemiBold 16px
Border radius   : 12px
Height          : 52px
```

**Text Button** (No background)
```
Text            : #4CAF82, Poppins Medium 16px
No border, no background
Pressed state   : opacity 0.6
```

### 7.3 Input Fields
```
Background      : #F3F4F6
Border          : 1px solid transparent
Border radius   : 12px
Height          : 52px
Padding         : 0 16px
Font            : Poppins Regular 16px, #1A1A2E
Placeholder     : #9CA3AF

Focused state:
  Border        : 1.5px solid #4CAF82
  Background    : #FFFFFF
  Shadow        : 0 0 0 3px rgba(76, 175, 130, 0.1)

Error state:
  Border        : 1.5px solid #FF6B6B
  Background    : #FFFFFF
```

**Amount Input (Special)**
```
Font            : Poppins Bold 36px, centered
Prefix "₹"      : Poppins Bold 24px, #6B7280
No visible border
Large touch target
Auto-focus on modal open
```

### 7.4 Transaction List Item
```
┌────────────────────────────────────────┐
│  [icon]  Who / Merchant         +₹500  │
│          Category · Method · Date      │
└────────────────────────────────────────┘

Layout:
  Row, vertically centered
  Left icon: 44x44 circle, category color bg, emoji centered
  Middle: two lines (who + meta), flex 1
  Right: amount, type badge below

Amount color:
  credit → #4CAF82
  debit  → #FF6B6B

Swipe left: reveals red delete button
Tap: opens transaction detail modal
```

### 7.5 Type & Nature Badges (Pills)
```
Income            : bg #E8F5EE, text #2D7A5C
Expense           : bg #FFF0F0, text #E53E3E
Lent              : bg #FFF4ED, text #C05621
Borrowed          : bg #EEF2FF, text #4338CA
Pass-through      : bg #F3F4F6, text #6B7280
Repayment         : bg #F0FFF4, text #276749

Pill shape: border-radius 999px, paddingHorizontal 10px, height 24px
Font: Poppins SemiBold 11px
```

### 7.6 Bottom Tab Bar
```
Background        : #FFFFFF
Height            : 64px (+ safe area bottom)
Shadow (top)      : 0 -1px 0 #E5E7EB
Border radius top : 0 (flush)

Active icon       : #4CAF82
Inactive icon     : #9CA3AF
Active label      : Poppins SemiBold 11px, #4CAF82
Inactive label    : Poppins Regular 11px, #9CA3AF

Active indicator  : small sage green dot above icon
```

Tabs:
```
① Home (house icon)
② Transactions (list icon)
③ [FAB in center — no tab]
④ Budget (target icon)
⑤ Settings (gear icon)
```

### 7.7 Floating Action Button (FAB)
```
Size              : 60px circle
Background        : #4CAF82
Icon              : white + icon, 28px
Shadow            : FAB shadow (see above)
Position          : center bottom tab area
Pressed state     : scale 0.92, background #2D7A5C
```

### 7.8 Bottom Sheet / Modal
```
Background        : #FFFFFF
Border radius     : 24px top corners only
Drag handle       : 4x36px, #E5E7EB, centered top
Padding           : 24px
Max height        : 90% of screen
Backdrop          : rgba(0,0,0,0.4), blurred
```

### 7.9 Section Headers
```
Font              : Poppins SemiBold 12px
Color             : #9CA3AF
Uppercase         : true
Letter spacing    : 0.8px
Margin bottom     : 8px
```

### 7.10 Empty State
```
Centered illustration (simple SVG)
Title   : Poppins SemiBold 18px, #1A1A2E
Subtitle: Poppins Regular 14px, #6B7280
CTA button below (primary)
```

### 7.11 User Profile Avatar (Header)
```
Size              : 40x40px circle
Background        : #E8F5EE
Initials          : Poppins Bold 16px, #4CAF82
(if no photo set)
Border            : 2px solid #4CAF82
```

---

## 8. Animation Specifications

Library: `react-native-reanimated`

### Screen Transitions
```
Enter             : fade in + slide up 20px
Duration          : 250ms
Easing            : easeOut
```

### Modal / Bottom Sheet
```
Open              : spring slide up from bottom
  mass: 1, damping: 20, stiffness: 200
Close             : timing slide down, 200ms easeIn
Backdrop          : fade in 200ms
```

### Transaction Card Entry
```
New card added    : spring scale from 0.8 + fade in
  mass: 0.8, damping: 15, stiffness: 150
Stagger delay     : 50ms per item on list load
```

### Delete (Swipe)
```
Swipe left        : translate X, reveal red delete zone
Delete confirm    : scale to 0 + fade out, 200ms
List reorder      : spring layout animation
```

### FAB Button
```
Tap               : scale 0.92, spring back
  mass: 0.5, damping: 10, stiffness: 200
```

### Dashboard Numbers
```
Count-up          : 0 → actual value, 800ms
Easing            : easeOut cubic
```

### Budget Alert
```
Exceeded          : horizontal shake, 3 times, 400ms total
Color pulse       : background flashes red briefly
```

### Tab Switch
```
Content           : fade crossfade, 150ms
Active indicator  : spring slide to new tab
```

### Input Focus
```
Border color      : 150ms ease
Shadow appear     : 150ms ease
Label float up    : 150ms ease (if floating label style)
```

---

## 9. Icons

Library: `lucide-react-native`

Consistent `strokeWidth: 1.8`, size `24px` throughout.

| Usage | Icon |
|---|---|
| Home tab | `Home` |
| Transactions tab | `List` |
| Budget tab | `Target` |
| Settings tab | `Settings` |
| Add transaction | `Plus` |
| Income / Credit | `ArrowDownLeft` |
| Expense / Debit | `ArrowUpRight` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Calendar / Date | `Calendar` |
| Category | `Tag` |
| Payment method | `CreditCard` |
| Cash | `Banknote` |
| UPI | `Smartphone` |
| Backup | `CloudUpload` |
| Restore | `CloudDownload` |
| Lock | `Lock` |
| Person / Who | `User` |
| Location | `MapPin` |
| Goal / Target | `Flag` |
| Notification | `Bell` |
| Back | `ChevronLeft` |
| Close modal | `X` |
| Filter | `SlidersHorizontal` |
| Search | `Search` |

---

## 10. Status Bar

```
Style             : dark-content (dark icons on light background)
Background        : #F8F7F4 (matches app background)
```

---

## 11. Screen Layout Template

```
┌─────────────────────────────────┐
│  Status Bar (#F8F7F4)           │
├─────────────────────────────────┤
│  Screen Header                  │  paddingHorizontal: 16
│  Title (Poppins Bold 24px)      │  paddingTop: 16
│  Subtitle (optional)            │  paddingBottom: 12
├─────────────────────────────────┤
│                                 │
│  Content Area                   │  paddingHorizontal: 16
│  (ScrollView / FlatList)        │  flex: 1
│                                 │
├─────────────────────────────────┤
│  Bottom Tab Bar                 │  height: 64 + safe area
└─────────────────────────────────┘
```

---

## 12. User Profile Display

```
Dashboard header:
┌─────────────────────────────────────┐
│  Good morning, Fawzaan 👋    [F]   │
│  June 2026                          │
└─────────────────────────────────────┘

[F] = avatar circle with initials, top right
Greeting changes: morning / afternoon / evening
```

Profile setup during onboarding:
- Name (required) → stored in config as `user_name`
- Avatar / photo (optional) → stored as local file path in config as `user_avatar`
- Initials auto-generated if no photo

---

## 13. Dashboard Card Design

```
┌─────────────────────────────────────┐  ← white card, 16px radius
│  This Month · June 2026             │  ← caption, muted
│                                     │
│  ₹52,000          Income  ↓         │  ← display size, green
│  ₹31,400          Expenses ↑        │  ← display size, red
│                                     │
│  ───────────────────────────────    │
│                                     │
│  Savings  ₹20,600  (39%)            │  ← h2, primary
└─────────────────────────────────────┘

Below card — two smaller info cards side by side:
┌──────────────┐  ┌──────────────┐
│ Lent         │  │ Borrowed     │
│ ₹2,500       │  │ ₹1,000       │
│ pending      │  │ pending      │
└──────────────┘  └──────────────┘
```
