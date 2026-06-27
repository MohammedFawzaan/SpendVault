// SpendVault Design System — Color Palette (UI_OVERVIEW.md §2)
export const Colors = {
  // Base
  appBackground: '#F8F7F4',
  surface: '#FFFFFF',
  primary: '#4CAF82',
  primaryDark: '#2D7A5C',
  primaryLight: '#E8F5EE',

  // Semantic
  debit: '#FF6B6B',
  debitLight: '#FFF0F0',
  credit: '#4CAF82',
  warning: '#F4A261',
  warningLight: '#FFF4ED',
  danger: '#E53E3E',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Border
  borderDefault: '#E5E7EB',
  borderFocus: '#4CAF82',
  borderError: '#FF6B6B',

  // Nature badge backgrounds + text
  badges: {
    income:      { bg: '#E8F5EE', text: '#2D7A5C' },
    expense:     { bg: '#FFF0F0', text: '#E53E3E' },
    lent:        { bg: '#FFF4ED', text: '#C05621' },
    borrowed:    { bg: '#EEF2FF', text: '#4338CA' },
    pass_through:{ bg: '#F3F4F6', text: '#6B7280' },
    repayment:   { bg: '#F0FFF4', text: '#276749' },
  },
} as const;

export type BadgeNature = keyof typeof Colors.badges;
