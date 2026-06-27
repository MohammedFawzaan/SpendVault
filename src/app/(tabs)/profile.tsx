import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <Text style={s.title}>Profile</Text>
      <Text style={s.sub}>Phase 7</Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.appBackground, alignItems: 'center', justifyContent: 'center' },
  title: { ...Typography.h2, color: Colors.textPrimary },
  sub: { ...Typography.body2, color: Colors.textSecondary, marginTop: 8 },
});
