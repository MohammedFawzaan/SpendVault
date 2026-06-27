import AnimEntry from '@/components/onboarding/AnimEntry';
import ProgressDots from '@/components/onboarding/ProgressDots';
import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { setSmsPermissionGranted } from '@/db/queries/config';
import { router } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import { PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    {
      title: 'SMS Permission',
      message: 'SpendVault reads your bank SMS to automatically log transactions. Your messages never leave your device.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export default function SmsPermission() {
  async function handleAllow() {
    const granted = await requestSmsPermission();
    setSmsPermissionGranted(granted);
    router.push('/onboarding/all-set');
  }

  function handleSkip() {
    setSmsPermissionGranted(false);
    router.push('/onboarding/all-set');
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right', 'bottom']}>
      <AnimEntry delay={0}><ProgressDots total={4} current={2} /></AnimEntry>

      <AnimEntry delay={80}>
        <View style={s.iconWrap}>
          <MessageSquare size={64} color={Colors.primary} strokeWidth={1.5} />
        </View>
      </AnimEntry>

      <AnimEntry delay={160}>
        <Text style={s.heading}>Auto-detect your transactions</Text>
      </AnimEntry>

      <AnimEntry delay={240}>
        <Text style={s.sub}>
          SpendVault reads your bank SMS to log transactions automatically.{'\n\n'}
          Your messages never leave your device.
        </Text>
      </AnimEntry>

      <AnimEntry delay={320}>
        <TouchableOpacity style={s.btn} onPress={handleAllow} activeOpacity={0.85}>
          <Text style={s.btnText}>Allow SMS Access</Text>
        </TouchableOpacity>
      </AnimEntry>

      <AnimEntry delay={400}>
        <TouchableOpacity onPress={handleSkip} style={s.skipWrap}>
          <Text style={s.skip}>Skip for now</Text>
        </TouchableOpacity>
      </AnimEntry>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.appBackground,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    alignItems: 'center',
  },
  iconWrap: {
    marginTop: 40,
    marginBottom: 32,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: Spacing.sm,
  },
  sub: {
    ...Typography.body2,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 48,
    paddingHorizontal: Spacing.lg,
  },
  btn: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    width: 280,
    ...Shadows.card,
  },
  btnText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  skipWrap: {
    marginTop: 20,
    padding: 8,
  },
  skip: {
    ...Typography.body1,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
