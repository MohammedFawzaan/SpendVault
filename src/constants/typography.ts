// SpendVault Design System — Typography (UI_OVERVIEW.md §3)
// Font family: Poppins via @expo-google-fonts/poppins

export const FontFamily = {
  regular:  'Poppins_400Regular',
  medium:   'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold:     'Poppins_700Bold',
} as const;

export const Typography = {
  display:       { fontFamily: 'Poppins_700Bold',    fontSize: 32, lineHeight: 40 },
  h1:            { fontFamily: 'Poppins_700Bold',    fontSize: 24, lineHeight: 32 },
  h2:            { fontFamily: 'Poppins_600SemiBold',fontSize: 20, lineHeight: 28 },
  h3:            { fontFamily: 'Poppins_600SemiBold',fontSize: 18, lineHeight: 26 },
  body1:         { fontFamily: 'Poppins_500Medium',  fontSize: 16, lineHeight: 24 },
  body2:         { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 22 },
  caption:       { fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 18 },
  label:         { fontFamily: 'Poppins_600SemiBold',fontSize: 12, lineHeight: 18 },
  button:        { fontFamily: 'Poppins_600SemiBold',fontSize: 16, lineHeight: 24 },
  amountLarge:   { fontFamily: 'Poppins_700Bold',    fontSize: 36, lineHeight: 44 },
  amountMedium:  { fontFamily: 'Poppins_700Bold',    fontSize: 20, lineHeight: 28 },
  sectionHeader: { fontFamily: 'Poppins_600SemiBold',fontSize: 12, lineHeight: 18, letterSpacing: 0.8 },
} as const;
