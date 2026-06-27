import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing, Radius, Shadows } from '@/constants/spacing';
import { createProfile } from '@/db/queries/userProfile';
import ProgressDots from '@/components/onboarding/ProgressDots';
import AnimEntry from '@/components/onboarding/AnimEntry';

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDOB(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function validateDOB(dob: string): string | null {
  if (dob.length === 0) return null;
  if (dob.length < 10) return 'Enter full date: DD/MM/YYYY';
  const [dd, mm, yyyy] = dob.split('/').map(Number);
  if (mm < 1 || mm > 12) return 'Invalid month';
  const maxDay = new Date(yyyy, mm, 0).getDate();
  if (dd < 1 || dd > maxDay) return 'Invalid day';
  const birth = new Date(yyyy, mm - 1, dd);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear() -
    (today < new Date(today.getFullYear(), mm - 1, dd) ? 1 : 0);
  if (yyyy < 1900) return 'Invalid year';
  if (birth > today) return 'Date cannot be in the future';
  if (age > 120) return 'Invalid date of birth';
  return null;
}


export default function ProfileSetup() {
  const [username,   setUsername]   = useState('');
  const [dob,        setDob]        = useState('');
  const [occupation, setOccupation] = useState('');
  const [focused,    setFocused]    = useState<string | null>(null);
  const [error,      setError]      = useState('');
  const [dobError,   setDobError]   = useState('');

  const dobRef = useRef<TextInput>(null);
  const occRef = useRef<TextInput>(null);

  function handleDOBChange(text: string) {
    const formatted = formatDOB(text);
    setDob(formatted);
    setDobError('');
  }

  function handleContinue() {
    if (!username.trim()) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    if (dob.length > 0) {
      const dobErr = validateDOB(dob);
      if (dobErr) { setDobError(dobErr); return; }
    }
    setDobError('');
    createProfile({
      username:    username.trim(),
      dateOfBirth: dob.length === 10 ? dob : null,
      occupation:  occupation.trim() || null,
      avatar:      null,
    });
    router.push('/onboarding/security');
  }

  const inputStyle = (field: string) => [
    s.input,
    focused === field && s.inputFocused,
  ];

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={24}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AnimEntry delay={0}>
            <ProgressDots total={4} current={0} />
          </AnimEntry>

          <AnimEntry delay={80}>
            <Text style={s.heading}>Set up your profile</Text>
            <Text style={s.sub}>Tell us a little about you</Text>
          </AnimEntry>

          <AnimEntry delay={160}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarInitials}>
                {username ? getInitials(username) : '👤'}
              </Text>
            </View>
          </AnimEntry>

          <AnimEntry delay={240}>
            <Text style={s.label}>WHAT SHOULD WE CALL YOU? *</Text>
            <TextInput
              style={inputStyle('username')}
              placeholder="Your name"
              placeholderTextColor={Colors.textTertiary}
              value={username}
              onChangeText={(t) => { setUsername(t); setError(''); }}
              onFocus={() => setFocused('username')}
              onBlur={() => setFocused(null)}
              returnKeyType="next"
              onSubmitEditing={() => dobRef.current?.focus()}
              autoCapitalize="words"
            />
            {!!error && <Text style={s.error}>{error}</Text>}
          </AnimEntry>

          <AnimEntry delay={320}>
            <Text style={s.label}>DATE OF BIRTH</Text>
            <TextInput
              ref={dobRef}
              style={inputStyle('dob')}
              placeholder="DD/MM/YYYY  (optional)"
              placeholderTextColor={Colors.textTertiary}
              value={dob}
              onChangeText={handleDOBChange}
              onFocus={() => setFocused('dob')}
              onBlur={() => setFocused(null)}
              keyboardType="numeric"
              returnKeyType="next"
              onSubmitEditing={() => occRef.current?.focus()}
              maxLength={10}
            />
            {!!dobError && <Text style={s.error}>{dobError}</Text>}
          </AnimEntry>

          <AnimEntry delay={400}>
            <Text style={s.label}>OCCUPATION</Text>
            <TextInput
              ref={occRef}
              style={inputStyle('occupation')}
              placeholder="e.g. Software Engineer  (optional)"
              placeholderTextColor={Colors.textTertiary}
              value={occupation}
              onChangeText={setOccupation}
              onFocus={() => setFocused('occupation')}
              onBlur={() => setFocused(null)}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              autoCapitalize="words"
            />
          </AnimEntry>

          <AnimEntry delay={480}>
            <TouchableOpacity style={s.btn} onPress={handleContinue} activeOpacity={0.85}>
              <Text style={s.btnText}>Continue</Text>
            </TouchableOpacity>
          </AnimEntry>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heading: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginTop: 28,
    marginBottom: 4,
  },
  sub: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginBottom: 28,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 28,
  },
  avatarInitials: {
    ...Typography.h2,
    color: Colors.primary,
  },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    height: 52,
    backgroundColor: '#F3F4F6',
    borderRadius: Radius.input,
    paddingHorizontal: Spacing.md,
    ...Typography.body1,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputFocused: {
    backgroundColor: Colors.surface,
    borderColor: Colors.borderFocus,
  },
  error: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: 4,
  },
  btn: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    ...Shadows.card,
  },
  btnText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
});
