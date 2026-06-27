# UI Overview & Design System
## SpendVault — Comprehensive Personal Finance Tracker — Android App

---

## 1. Design Philosophy

- Light, soothing, calm — this app is opened multiple times a day; it must never feel harsh or heavy
- Clean and minimal — no clutter, every element earns its place
- Finance-friendly — green for money in, red for money out, universal and intuitive
- Animated throughout — every interaction has a response, every transition has motion
- Poppins everywhere — single font family, consistent rhythm throughout

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
| display | Bold 700 | 32px | 40px | Large amounts on dashboard |
| h1 | Bold 700 | 24px | 32px | Screen titles |
| h2 | SemiBold 600 | 20px | 28px | Section headings, card titles |
| h3 | SemiBold 600 | 18px | 26px | Modal titles |
| body1 | Medium 500 | 16px | 24px | Primary body text, list items |
| body2 | Regular 400 | 14px | 22px | Secondary body, descriptions |
| caption | Regular 400 | 12px | 18px | Timestamps, hints, meta |
| label | SemiBold 600 | 12px | 18px | Badges, tags, pill labels |
| button | SemiBold 600 | 16px | 24px | All button text |
| amount_large | Bold 700 | 36px | 44px | Input amount field |
| amount_medium | Bold 700 | 20px | 28px | Transaction list amounts |

---

## 4. Spacing System

Base unit: 8px. All spacing is a multiple of 8.

```
4px   -> micro gaps (icon to text)
8px   -> xs (tight inner padding)
12px  -> sm (compact padding)
16px  -> md (standard padding, most used)
24px  -> lg (card padding, section gaps)
32px  -> xl (screen top padding)
48px  -> 2xl (large section separators)
```

Screen Horizontal Padding: paddingHorizontal 16px on all screens.

---

## 5. Border Radius

```
4px   -> tags, small chips
8px   -> input fields, small buttons
12px  -> buttons, list items
16px  -> cards (main radius throughout)
24px  -> modals, bottom sheets
999px -> pill badges, FAB button
```

---

## 6. Elevation & Shadows

Soft, barely-visible shadows. Nothing heavy.

```ts
// Card shadow
shadowColor: '#000000'
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.06
shadowRadius: 12
elevation: 3

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
Shadow          : card shadow
Margin bottom   : 12px
```

### 7.2 Buttons

Primary Button (Sage Green filled)
```
Background    : #4CAF82
Text          : #FFFFFF, Poppins SemiBold 16px
Border radius : 12px
Height        : 52px
Pressed state : background #2D7A5C, scale 0.97
Animation     : spring scale on press, color transition 150ms
```

Secondary Button (Outlined)
```
Background    : transparent
Border        : 1.5px solid #4CAF82
Text          : #4CAF82, Poppins SemiBold 16px
Border radius : 12px
Height        : 52px
Pressed state : background #E8F5EE
Animation     : background fade 150ms
```

Danger Button (Delete actions)
```
Background    : #FFF0F0
Text          : #E53E3E, Poppins SemiBold 16px
Border radius : 12px
Height        : 52px
Animation     : scale 0.97 on press
```

Text Button
```
Text          : #4CAF82, Poppins Medium 16px
No border, no background
Pressed state : opacity 0.6, 100ms ease
```

### 7.3 Input Fields
```
Background    : #F3F4F6
Border        : 1px solid transparent
Border radius : 12px
Height        : 52px
Padding       : 0 16px
Font          : Poppins Regular 16px, #1A1A2E
Placeholder   : #9CA3AF

Focused state:
  Border      : 1.5px solid #4CAF82
  Background  : #FFFFFF
  Shadow      : 0 0 0 3px rgba(76, 175, 130, 0.1)
  Animation   : border color + shadow 150ms ease

Error state:
  Border      : 1.5px solid #FF6B6B
  Animation   : horizontal shake (3 times, 300ms)
```

Amount Input (Special)
```
Font          : Poppins Bold 36px, centered
Prefix symbol : Poppins Bold 24px, #6B7280
No visible border
Auto-focus on modal open
Animation     : cursor blink, number scales slightly on change
```

### 7.4 Transaction List Item
```
+────────────────────────────────────────+
|  [icon]  Who / Merchant        +500   |
|          Category · Method · Date      |
+────────────────────────────────────────+

Left icon    : 44x44 circle, category color background, emoji centered
Middle       : two lines (who + meta), flex 1
Right        : amount (green credit / red debit)
Swipe left   : reveals red delete zone with Trash icon
Tap          : spring scale 0.98 on press, opens detail modal
```

### 7.5 Type & Nature Badges (Pills)
```
Income           : bg #E8F5EE, text #2D7A5C
Expense          : bg #FFF0F0, text #E53E3E
Lent             : bg #FFF4ED, text #C05621
Borrowed         : bg #EEF2FF, text #4338CA
Pass-through     : bg #F3F4F6, text #6B7280
Repayment        : bg #F0FFF4, text #276749

Shape            : border-radius 999px, paddingHorizontal 10px, height 24px
Font             : Poppins SemiBold 11px
Animation        : fade in when badge appears
```

### 7.6 Bottom Tab Bar — 4 Tabs
```
Background       : #FFFFFF
Height           : 64px + safe area bottom
Shadow top       : 0 -1px 0 #E5E7EB

Active icon      : #4CAF82
Inactive icon    : #9CA3AF
Active label     : Poppins SemiBold 11px, #4CAF82
Inactive label   : Poppins Regular 11px, #9CA3AF
Active indicator : small sage green pill above active icon

Animation        : active indicator slides to new tab (spring)
                   icon scale 1.1 on press then back (spring)
                   label color transitions 150ms

Tabs:
  1  Home          (House icon)
  2  Transactions  (List icon)
  3  [FAB center — no tab label]
  4  Budget+Goals  (Target icon)
  5  Profile       (User icon)

Note: FAB sits in the center of the tab bar, raised above it.
Tab 3 slot is empty — FAB floats over it.
```

### 7.7 Floating Action Button (FAB)
```
Size             : 60px circle
Background       : #4CAF82
Icon             : white Plus icon, 28px
Shadow           : FAB shadow (green tinted)
Position         : center of tab bar, raised 12px above it
Pressed state    : scale 0.92, background #2D7A5C
Animation        : spring bounce on press
                   rotate 45deg to X icon when modal opens (optional)
                   rotate back when modal closes
```

### 7.8 Bottom Sheet / Modal
```
Background       : #FFFFFF
Border radius    : 24px top corners only
Drag handle      : 4x36px, #E5E7EB, centered top, 8px from top
Padding          : 24px
Max height       : 90% of screen
Backdrop         : rgba(0,0,0,0.4)
Animation        : spring slide up from bottom on open
                   timing slide down 200ms on close
                   backdrop fade in/out 200ms
```

### 7.9 Section Headers
```
Font             : Poppins SemiBold 12px
Color            : #9CA3AF
Uppercase        : true
Letter spacing   : 0.8px
Margin bottom    : 8px
```

### 7.10 Empty State
```
Centered SVG illustration
Title    : Poppins SemiBold 18px, #1A1A2E
Subtitle : Poppins Regular 14px, #6B7280
CTA button below (primary)
Animation: fade in + scale from 0.9 on mount
```

### 7.11 User Profile Avatar
```
Large (Profile tab) : 80x80px circle
Small (Dashboard)   : 40x40px circle
Background          : #E8F5EE
Initials            : Poppins Bold, #4CAF82
Border              : 2px solid #4CAF82
Animation           : scale spring on tap (profile tab)
```

---

## 8. Animation Specifications

Library: react-native-reanimated

### 8.1 App Launch & Lock Screen
```
Logo appears     : fade in + scale from 0.8, spring, 400ms
Lock icon        : pulse animation loop (scale 1.0 -> 1.05 -> 1.0), 2s loop
Unlock success   : screen slides up and fades out, 300ms
Unlock fail      : screen shakes horizontally (3x), 300ms
```

### 8.2 Onboarding Screens
```
Screen transition : slide left (next) / slide right (back), 300ms spring
Content entry     : fade in + slide up 30px, staggered per element (80ms delay each)
CTA button        : bounces in last (after all content), spring
Avatar picker     : scale spring when tapped, ripple on selection
Progress dots     : active dot scales 1.5x, spring transition between screens
```

### 8.3 Screen Transitions (Tab Navigation)
```
Tab switch        : content fade crossfade, 150ms ease
Active tab icon   : scale 1.1 spring on press, back to 1.0
Active indicator  : spring slides horizontally to new tab
Screen mount      : fade in + slide up 20px, 250ms easeOut
```

### 8.4 Dashboard
```
Initial load      : cards appear staggered, 60ms delay each, slide up + fade
Numbers           : count up from 0 to actual value, 800ms easeOut cubic
Savings %         : count up after income and expense numbers finish
Pull to refresh   : spring bounce, numbers recount
Greeting text     : fade in, 300ms, 200ms delay after header
Recent list       : items stagger in, 50ms delay per item, slide up + fade
```

### 8.5 Transaction List
```
List mount        : items stagger in, 40ms per item, slide up + fade in
New item added    : springs in from top, scale 0.8 -> 1.0
Item deleted      : scale to 0 + fade out, 200ms, list reflows with spring
Swipe left        : translateX follows finger, rubber-band at limit
Delete zone       : fade in as swipe progresses
Snap back         : spring return if not swiped far enough
Month change      : old list slides out left, new list slides in right, 250ms
Filter applied    : list fades out, filtered list fades in, 200ms
Search results    : real-time, each keystroke fades list and updates
```

### 8.6 Add / Edit Transaction Modal
```
Modal open        : spring slide up from bottom, backdrop fades in
Step transition   : slide left (forward), slide right (back), 250ms spring
Type toggle       : background color slides from debit red to credit green, 200ms
Nature pills      : slide in from right on type change, stagger 40ms each
Amount input      : digit change scales slightly (1.0 -> 1.05 -> 1.0), spring
Save button       : loading spinner fades in on tap
Success           : modal slides down, new card springs into list
Error (validation): field shakes horizontally (3x, 300ms), border pulses red
```

### 8.7 FAB Button
```
Press             : scale 0.92, spring back
Hover/long-press  : subtle shadow pulse
Modal open        : rotates +45deg (Plus -> X), spring, 250ms
Modal close       : rotates back to 0, spring
```

### 8.8 Budget & Goals Screen
```
Screen mount      : budget cards stagger in, 60ms delay, slide up + fade
Budget card       : number fills from left to right animating the spent amount
Exceeded state    : card border pulses red (2x), background briefly flashes
Goal card mount   : same stagger as budget cards
Progress number   : counts up from 0 on mount
Goal completed    : card scales to 1.05 then back, green flash, checkmark appears
```

### 8.9 Profile Screen
```
Screen mount      : avatar drops in from top with spring bounce
Username          : fades in 200ms after avatar lands
Stats cards       : stagger in from bottom, 80ms delay each
Real-time clock   : smooth minute transitions (fade out/in on minute change)
Avatar tap        : scale spring 1.0 -> 1.08 -> 1.0
Settings button   : scale 0.97 on press, spring back
```

### 8.10 Settings Screen
```
Screen slides in from right (push navigation), 300ms spring
Each settings row : fade in staggered, 40ms delay per row
Toggle switch     : spring thumb slide, color transitions 200ms
Save button       : brief loading state, success checkmark appears then fades
```

### 8.11 Delete Confirmation
```
Alert appears     : fade in + scale from 0.9, spring
Backdrop          : fade in 200ms
Confirm button    : brief red pulse on tap before action executes
Cancel            : alert scales back to 0.9 + fades out
```

### 8.12 Backup & Restore
```
Backup Now tap    : button shows progress spinner
Backup complete   : success checkmark springs in, toast slides up from bottom
Toast             : slides up from bottom, stays 3s, slides back down
Restore progress  : linear progress bar animates across screen
Restore complete  : full screen success flash, then home screen fades in
```

### 8.13 Notification / Alert Toast
```
Slide up from bottom, spring, 300ms
Auto-dismiss after 3 seconds, slide back down
Swipe down to dismiss early
Success toast  : #E8F5EE background, sage green icon
Error toast    : #FFF0F0 background, red icon
Info toast     : #F3F4F6 background, gray icon
```

### 8.14 Input Focus Animations
```
Border color     : transparent -> #4CAF82, 150ms ease
Shadow appear    : 0 -> glow, 150ms ease
Label            : if floating label style, moves up 150ms ease
```

### 8.15 Number/Amount Change
```
When a total updates on dashboard:
  Old number fades out upward (translateY -10px + opacity 0, 150ms)
  New number fades in from below (translateY +10px -> 0 + opacity 1, 150ms)
```

---

## 9. Icons

Library: lucide-react-native
Stroke width: 1.8, size: 24px throughout

| Usage | Icon |
|---|---|
| Home tab | Home |
| Transactions tab | List |
| Budget & Goals tab | Target |
| Profile tab | User |
| Add transaction | Plus |
| Income / Credit | ArrowDownLeft |
| Expense / Debit | ArrowUpRight |
| Edit | Pencil |
| Delete | Trash2 |
| Calendar / Date | Calendar |
| Category | Tag |
| Payment method | CreditCard |
| Cash | Banknote |
| UPI | Smartphone |
| Bank Transfer | Building2 |
| Backup | CloudUpload |
| Restore | CloudDownload |
| Lock | Lock |
| Biometric | Fingerprint |
| Person / Who | User |
| Location / Where | MapPin |
| Goal | Flag |
| Notification | Bell |
| Back | ChevronLeft |
| Close modal | X |
| Filter | SlidersHorizontal |
| Search | Search |
| Settings | Settings |
| Occupation | Briefcase |
| Clock / Time | Clock |
| Check / Success | CheckCircle |
| Warning | AlertTriangle |

---

## 10. Status Bar

```
Style      : dark-content (dark icons on light background)
Background : #F8F7F4 (matches app background)
```

---

## 11. Screen Layout Template

```
+─────────────────────────────────+
|  Status Bar (#F8F7F4)           |
+─────────────────────────────────+
|  Screen Header                  |  paddingHorizontal: 16
|  Title (Poppins Bold 24px)      |  paddingTop: 16
|  Subtitle (optional)            |  paddingBottom: 12
+─────────────────────────────────+
|                                 |
|  Content Area                   |  paddingHorizontal: 16
|  (ScrollView / FlatList)        |  flex: 1
|                                 |
+─────────────────────────────────+
|  Bottom Tab Bar                 |  height: 64 + safe area
+─────────────────────────────────+
```

---

## 12. Dashboard Screen Layout

```
+─────────────────────────────────────+
|  Good morning, [Username]    [AVT]  |  <- greeting + avatar
|  June 2026                          |  <- current month
+─────────────────────────────────────+
|  +───────────────────────────────+  |
|  |  This Month · June 2026       |  |  <- white card, 16px radius
|  |  Income    52,000  (green)    |  |
|  |  Expenses  31,400  (red)      |  |
|  |  ──────────────────────────   |  |
|  |  Savings   20,600  (39%)      |  |
|  +───────────────────────────────+  |
|                                     |
|  +──────────────+ +──────────────+  |
|  | Lent  2,500  | | Borrow 1,000 |  |  <- two small side cards
|  | pending      | | pending      |  |
|  +──────────────+ +──────────────+  |
|                                     |
|  RECENT                             |  <- section header
|  [Transaction item]                 |
|  [Transaction item]                 |
|  [Transaction item]                 |
|  See all ->                         |
+─────────────────────────────────────+
```

---

## 13. Profile Screen Layout

```
+─────────────────────────────────────+
|  "Profile"                          |  <- screen title
+─────────────────────────────────────+
|                                     |
|           +─────────+               |
|           | [AVATAR]|               |  <- 80x80px circle, centered
|           +─────────+               |
|           [Username]                |  <- h1, centered
|           [Occupation]              |  <- body2, muted, centered
|                                     |
|  ───────────────────────────────    |
|  Saturday, 27 June 2026   2:45 PM  |  <- real-time clock, centered
|  ───────────────────────────────    |
|                                     |
|  +───────────────────────────────+  |
|  |  This Month                   |  |  <- white card
|  |  Last Salary    52,000        |  |
|  |  Credited on    5 Jun 2026    |  |
|  |  ──────────────────────────   |  |
|  |  Total Budget   20,000        |  |
|  |  Total Spent    15,200        |  |
|  |  Remaining       4,800        |  |
|  +───────────────────────────────+  |
|                                     |
|  +───────────────────────────────+  |
|  |  Settings                  -> |  |  <- secondary button / tappable row
|  +───────────────────────────────+  |
|                                     |
+─────────────────────────────────────+
```

---

## 14. Lock Screen Layout

```
+─────────────────────────────────────+
|                                     |
|           +─────────+               |
|           |SpendVault logo          |
|           +─────────+               |
|                                     |
|           "SpendVault"              |  <- h1, centered
|                                     |
|                                     |
|           [Fingerprint icon]        |  <- 64px, #4CAF82, pulsing
|                                     |
|      "Tap to unlock"                |  <- body2, muted, centered
|                                     |
|      "Use PIN instead"              |  <- text button
|                                     |
+─────────────────────────────────────+
```

---

## 15. Animation Summary — Where Animations Appear

| Screen / Component | Animation |
|---|---|
| App launch | Logo spring in, pulse |
| Lock screen | Fingerprint pulse loop, shake on fail, slide out on success |
| Onboarding | Slide transitions, staggered content entry, progress dots spring |
| Tab switch | Crossfade content, indicator slides, icon scales |
| Dashboard mount | Card stagger, number count-up, greeting fade |
| Dashboard refresh | Numbers recount |
| Transaction list | Stagger entry, swipe-to-delete, month slide change |
| New transaction added | Card springs into list |
| Transaction deleted | Scale out + fade, list reflows |
| Add transaction modal | Spring up, step slides, type toggle color, field shake on error |
| FAB | Spring scale, rotate on modal open/close |
| Budget card mount | Stagger entry, spent amount animates |
| Budget exceeded | Border pulse red, background flash |
| Goal completed | Scale flash, checkmark spring in |
| Profile mount | Avatar drops in, stats stagger |
| Real-time clock | Minute fade transition |
| Settings mount | Rows stagger in |
| Toast notification | Slide up from bottom, auto-dismiss slide down |
| Amount updates | Old value fades up, new value fades in from below |
| Input focus | Border color + shadow 150ms |
| Input error | Horizontal shake |
| Buttons | Scale spring on press |
| Delete alert | Scale in spring, backdrop fade |
| Backup complete | Success checkmark spring, toast |
| Restore complete | Full screen flash, home fade in |