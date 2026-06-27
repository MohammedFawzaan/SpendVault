import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { Fingerprint, Lock, Delete } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { getAuthMethod, getPin } from '@/db/queries/config';
import { useAuth } from '@/context/AuthContext';

type Screen = 'lock' | 'pin';

function PinDots({ count, total }: { count: number; total: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i < count && styles.dotFilled]}
        />
      ))}
    </View>
  );
}

export default function LockScreen() {
  const { authenticate } = useAuth();
  const [screen, setScreen] = useState<Screen>('lock');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [hasBiometric, setHasBiometric] = useState(false);

  // animations
  const pulseScale = useSharedValue(1);
  const shakeX = useSharedValue(0);
  const slideY = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  const authMethod = getAuthMethod();
  const savedPin = getPin();
  const pinLength = savedPin?.length ?? 4;

  // start pulse loop
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900 }),
        withTiming(1.0, { duration: 900 })
      ),
      -1,
      true
    );
  }, []);

  // check biometric availability
  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then((has) => {
      if (has) LocalAuthentication.isEnrolledAsync().then(setHasBiometric);
    });
  }, []);

  const goToMain = useCallback(() => {
    authenticate();
    slideY.value = withTiming(-80, { duration: 250 });
    screenOpacity.value = withTiming(0, { duration: 300 });
    setTimeout(() => router.replace('/(tabs)'), 320);
  }, [authenticate]);

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, []);

  const tryBiometric = useCallback(async () => {
    if (!hasBiometric) return;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock SpendVault',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: true,
    });
    if (result.success) {
      goToMain();
    }
  }, [hasBiometric, goToMain]);

  // auto-trigger biometric on mount if method is biometric
  useEffect(() => {
    if (authMethod === 'biometric') {
      const t = setTimeout(tryBiometric, 400);
      return () => clearTimeout(t);
    }
  }, [authMethod, hasBiometric]);

  const handlePinDigit = useCallback(
    (digit: string) => {
      if (pin.length >= pinLength) return;
      const next = pin + digit;
      setPin(next);
      setError('');

      if (next.length === pinLength) {
        if (next === savedPin) {
          goToMain();
        } else {
          triggerShake();
          setError('Incorrect PIN');
          setTimeout(() => setPin(''), 600);
        }
      }
    },
    [pin, pinLength, savedPin, goToMain, triggerShake]
  );

  const handleBackspace = useCallback(() => {
    setPin((p) => p.slice(0, -1));
    setError('');
  }, []);

  // animated styles
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ translateY: slideY.value }],
  }));

  const PAD = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  if (screen === 'pin') {
    return (
      <SafeAreaView style={styles.root}>
        <Animated.View style={[styles.flex, screenStyle]}>
          <View style={styles.pinContainer}>
            <Lock size={40} color={Colors.primary} strokeWidth={1.8} />
            <Text style={styles.pinTitle}>Enter PIN</Text>
            <Animated.View style={shakeStyle}>
              <PinDots count={pin.length} total={pinLength} />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </Animated.View>

            <View style={styles.numpad}>
              {PAD.map((key, i) => {
                if (key === '') return <View key={i} style={styles.numKey} />;
                if (key === '⌫') {
                  return (
                    <TouchableOpacity
                      key={i}
                      style={styles.numKey}
                      onPress={handleBackspace}
                      activeOpacity={0.6}
                    >
                      <Delete size={22} color={Colors.textSecondary} strokeWidth={1.8} />
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.numKey}
                    onPress={() => handlePinDigit(key)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.numKeyText}>{key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {authMethod === 'biometric' && hasBiometric && (
              <TouchableOpacity onPress={tryBiometric} style={styles.switchBtn}>
                <Text style={styles.switchText}>Use Biometric</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <Animated.View style={[styles.flex, styles.lockContainer, screenStyle]}>
        {/* Logo */}
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>💰</Text>
        </View>
        <Text style={styles.appName}>SpendVault</Text>

        <View style={styles.spacer} />

        {/* Fingerprint */}
        <Pressable onPress={tryBiometric}>
          <Animated.View style={[styles.fingerprintWrap, pulseStyle]}>
            <Fingerprint size={64} color={Colors.primary} strokeWidth={1.4} />
          </Animated.View>
        </Pressable>

        <Text style={styles.tapText}>Tap to unlock</Text>

        <TouchableOpacity
          onPress={() => setScreen('pin')}
          style={styles.pinSwitch}
          activeOpacity={0.7}
        >
          <Text style={styles.pinSwitchText}>Use PIN instead</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },
  flex: { flex: 1 },
  lockContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 80,
    paddingBottom: 48,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoEmoji: { fontSize: 40 },
  appName: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  spacer: { flex: 1 },
  fingerprintWrap: {
    padding: 16,
    marginBottom: 16,
  },
  tapText: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  pinSwitch: { paddingVertical: 8, paddingHorizontal: 16 },
  pinSwitchText: {
    ...Typography.body1,
    color: Colors.primary,
  },

  // PIN screen
  pinContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    paddingHorizontal: 24,
  },
  pinTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.primary,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    textAlign: 'center',
    marginTop: 8,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    gap: 12,
    justifyContent: 'center',
  },
  numKey: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  numKeyText: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  switchBtn: { paddingVertical: 8 },
  switchText: {
    ...Typography.body1,
    color: Colors.primary,
  },
});
