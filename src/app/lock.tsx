import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LockScreen() {
  return (
    <SafeAreaView style={s.root}>
      <Text style={s.title}>SpendVault</Text>
      <Text style={s.sub}>Lock screen — coming in Phase 3</Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.appBackground,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  sub: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
});
