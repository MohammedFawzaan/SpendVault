import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence,
} from 'react-native-reanimated';
import * as LocalAuth from 'expo-local-authentication';
import { Fingerprint, Lock, ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing, Radius, Shadows } from '@/constants/spacing';
import { setAuthMethod, setPin } from '@/db/queries/config';
import ProgressDots from '@/components/onboarding/ProgressDots';
import AnimEntry from '@/components/onboarding/AnimEntry';

type Mode = 'choose' | 'pin-enter' | 'pin-confirm';
const PIN_LENGTH = 4;

function PinDots({ length, filled }: { length: number; filled: number }) {
  return (
    <View style={ps.dotRow}>
      {Array.from({ length }, (_, i) => (
        <View key={i} style={[ps.dot, i < filled && ps.dotFilled]} />
      ))}
    </View>
  );
}

function Numpad({ onPress, onDelete }: { onPress: (d: string) => void; onDelete: () => void }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <View style={ps.numpad}>
      {keys.map((k, i) => (
        k === '' ? <View key={i} style={ps.numKey} /> :
        <Pressable
          key={i}
          style={({ pressed }) => [ps.numKey, pressed && { backgroundColor: Colors.primaryLight }]}
          onPress={() => k === '⌫' ? onDelete() : onPress(k)}
        >
          <Text style={ps.numKeyText}>{k}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SecuritySetup() {
  const [mode, setMode]           = useState<Mode>('choose');
  const [canBio, setCanBio]       = useState(false);
  const [pin, setEnteredPin]      = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  useEffect(() => {
    (async () => {
      const hw = await LocalAuth.hasHardwareAsync();
      const enrolled = await LocalAuth.isEnrolledAsync();
      setCanBio(hw && enrolled);
    })();
  }, []);

  function shake() {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 60 }), withTiming(8, { duration: 60 }),
      withTiming(-8, { duration: 60 }), withTiming(8, { duration: 60 }),
      withTiming(0,  { duration: 60 }),
    );
  }

  async function handleBiometric() {
    const res = await LocalAuth.authenticateAsync({
      promptMessage: 'Confirm your biometric to set up app lock',
      cancelLabel: 'Use PIN instead',
    });
    if (res.success) {
      setAuthMethod('biometric');
      router.push('/onboarding/sms-permission');
    } else {
      setMode('pin-enter');
    }
  }

  function handleDigit(d: string) {
    if (isConfirming) {
      if (confirmPin.length < PIN_LENGTH) {
        const next = confirmPin + d;
        setConfirmPin(next);
        if (next.length === PIN_LENGTH) validateConfirm(next);
      }
    } else {
      if (pin.length < PIN_LENGTH) {
        const next = pin + d;
        setEnteredPin(next);
        if (next.length === PIN_LENGTH) setIsConfirming(true);
      }
    }
  }

  function handleDelete() {
    if (isConfirming) setConfirmPin(p => p.slice(0, -1));
    else setEnteredPin(p => p.slice(0, -1));
  }

  function validateConfirm(entered: string) {
    if (entered === pin) {
      setPin(pin);
      setAuthMethod('pin');
      router.push('/onboarding/sms-permission');
    } else {
      shake();
      Alert.alert('Mismatch', "PINs don't match. Try again.");
      setConfirmPin('');
      setEnteredPin('');
      setIsConfirming(false);
    }
  }

  const currentPin   = isConfirming ? confirmPin : pin;
  const heading      = isConfirming ? 'Confirm your PIN' : 'Create a PIN';
  const subText      = isConfirming ? 'Re-enter your 4-digit PIN' : 'Enter a 4-digit PIN';

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right', 'bottom']}>
      <AnimEntry delay={0}><ProgressDots total={4} current={1} /></AnimEntry>

      {mode === 'choose' ? (
        <>
          <AnimEntry delay={80}>
            <View style={s.iconWrap}>
              <Fingerprint size={64} color={Colors.primary} strokeWidth={1.5} />
            </View>
          </AnimEntry>
          <AnimEntry delay={160}>
            <Text style={s.heading}>Secure SpendVault</Text>
            <Text style={s.sub}>App lock is required — your data stays private</Text>
          </AnimEntry>
          <AnimEntry delay={240}>
            {canBio ? (
              <TouchableOpacity style={s.btn} onPress={handleBiometric} activeOpacity={0.85}>
                <Text style={s.btnText}>Set Up Biometric</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.btn} onPress={() => setMode('pin-enter')} activeOpacity={0.85}>
                <Text style={s.btnText}>Set Up PIN</Text>
              </TouchableOpacity>
            )}
          </AnimEntry>
          {canBio && (
            <AnimEntry delay={320}>
              <TouchableOpacity onPress={() => setMode('pin-enter')} style={s.linkWrap}>
                <Text style={s.link}>Use PIN instead</Text>
              </TouchableOpacity>
            </AnimEntry>
          )}
        </>
      ) : (
        <>
          <AnimEntry delay={0}>
            {isConfirming ? (
              <TouchableOpacity onPress={() => { setIsConfirming(false); setConfirmPin(''); }} style={s.back}>
                <ChevronLeft size={20} color={Colors.textSecondary} />
                <Text style={s.backText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setMode('choose')} style={s.back}>
                <ChevronLeft size={20} color={Colors.textSecondary} />
                <Text style={s.backText}>Back</Text>
              </TouchableOpacity>
            )}
          </AnimEntry>
          <AnimEntry delay={80}>
            <View style={s.iconWrap}>
              <Lock size={48} color={Colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={s.heading}>{heading}</Text>
            <Text style={s.sub}>{subText}</Text>
          </AnimEntry>
          <AnimEntry delay={160}>
            <Animated.View style={shakeStyle}>
              <PinDots length={PIN_LENGTH} filled={currentPin.length} />
            </Animated.View>
          </AnimEntry>
          <AnimEntry delay={240}>
            <Numpad onPress={handleDigit} onDelete={handleDelete} />
          </AnimEntry>
        </>
      )}
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
    marginTop: 32,
    marginBottom: 24,
    alignItems: 'center',
  },
  heading: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    ...Typography.body2,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
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
  linkWrap: {
    marginTop: 20,
    padding: 8,
  },
  link: {
    ...Typography.body1,
    color: Colors.primary,
    textAlign: 'center',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 8,
  },
  backText: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
});

const ps = StyleSheet.create({
  dotRow: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    marginBottom: 48,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.borderDefault,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    height: 64,
    borderRadius: Radius.card,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numKeyText: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
});
