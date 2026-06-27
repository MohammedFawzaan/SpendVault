import { useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';
import { CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing, Radius, Shadows } from '@/constants/spacing';
import { setOnboardingComplete } from '@/db/queries/config';
import { getProfile } from '@/db/queries/userProfile';
import ProgressDots from '@/components/onboarding/ProgressDots';

export default function AllSet() {
  const profile = getProfile();
  const name    = profile?.username ?? 'there';

  const iconScale = useSharedValue(0.85);
  const iconOp    = useSharedValue(0);
  const textOp    = useSharedValue(0);
  const textTy    = useSharedValue(12);

  useEffect(() => {
    iconScale.value = withDelay(100, withSpring(1, { damping: 18 }));
    iconOp.value    = withDelay(100, withTiming(1, { duration: 250 }));
    textOp.value    = withDelay(300, withTiming(1, { duration: 250 }));
    textTy.value    = withDelay(300, withSpring(0, { damping: 22 }));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconOp.value,
  }));
  const textStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTy.value }],
    opacity: textOp.value,
  }));

  function handleGoHome() {
    setOnboardingComplete();
    router.replace('/lock');
  }

  return (
    <SafeAreaView style={s.root}>
      <ProgressDots total={4} current={3} />

      <Animated.View style={[s.iconWrap, iconStyle]}>
        <CheckCircle size={96} color={Colors.primary} strokeWidth={1.5} />
      </Animated.View>

      <Animated.View style={textStyle}>
        <Text style={s.heading}>You're all set, {name}!</Text>
        <Text style={s.sub}>Start tracking your money</Text>
      </Animated.View>

      <TouchableOpacity style={s.btn} onPress={handleGoHome} activeOpacity={0.85}>
        <Text style={s.btnText}>Go to Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.appBackground,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  iconWrap: {
    marginBottom: 32,
    marginTop: 24,
  },
  heading: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    ...Typography.body1,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 56,
  },
  btn: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  btnText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
});
