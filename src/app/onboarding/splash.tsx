import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

export default function SplashScreen() {
  const scale   = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value   = withSpring(1, { damping: 14 });
    opacity.value = withTiming(1, { duration: 400 });

    const t = setTimeout(() => router.replace('/onboarding/profile'), 2000);
    return () => clearTimeout(t);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <SafeAreaView style={s.root}>
      <Animated.View style={[s.content, animStyle]}>
        <View style={s.logoCircle}>
          <Text style={s.logoEmoji}>💰</Text>
        </View>
        <Text style={s.title}>SpendVault</Text>
        <Text style={s.tagline}>Your complete money story</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.appBackground,
    alignItems: 'center',
    justifyContent: 'center',
  } as any,
  content: {
    alignItems: 'center',
    gap: 16,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoEmoji: {
    fontSize: 44,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  tagline: {
    ...Typography.body1,
    color: Colors.textSecondary,
  },
});
