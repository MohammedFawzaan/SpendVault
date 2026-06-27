// SpendVault Design System — Spacing, Radius, Shadows (UI_OVERVIEW.md §4-6)

export const Spacing = {
  micro: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screenH: 16,
} as const;

export const Radius = {
  tag: 4,
  input: 8,
  button: 12,
  card: 16,
  modal: 24,
  pill: 999,
} as const;

export const Shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  fab: {
    shadowColor: '#4CAF82',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;
