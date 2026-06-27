import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, X, Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { Shadows } from '@/constants/spacing';
import { getProfile, updateProfile } from '@/db/queries/userProfile';
import { getAuthMethod, getLastBackupAt } from '@/db/queries/config';
import { performBackup, shareBackup, pickAndValidateBackup, applyRestore } from '@/services/backup';
import type { UserProfile } from '@/db/schema';
import { Toast, type ToastType } from '@/components/Toast';

const EMOJI_OPTIONS = ['😀','🧑','👨','👩','🧔','🐱','🦁','🐸','🌟','🔥','💎','🎯'];

function EditProfileSheet({ visible, profile, onClose, onSaved }: {
  visible: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [username, setUsername] = useState(profile?.username ?? '');
  const [dob, setDob]           = useState(profile?.dateOfBirth ?? '');
  const [occupation, setOccupation] = useState(profile?.occupation ?? '');
  const [avatar, setAvatar]     = useState(profile?.avatar ?? '');

  const slideY  = useSharedValue(600);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setUsername(profile?.username ?? '');
      setDob(profile?.dateOfBirth ?? '');
      setOccupation(profile?.occupation ?? '');
      setAvatar(profile?.avatar ?? '');
      slideY.value  = withSpring(0, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      slideY.value  = withTiming(600, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle    = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  function handleSave() {
    if (!username.trim()) { Alert.alert('Error', 'Username is required.'); return; }
    updateProfile({
      username: username.trim(),
      dateOfBirth: dob || null,
      occupation: occupation.trim() || null,
      avatar: avatar || null,
    });
    onSaved();
  }

  if (!visible) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={sh.overlay}>
        <Animated.View style={[sh.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[sh.sheet, sheetStyle]}>
          <View style={sh.handle} />
          <View style={sh.header}>
            <Text style={sh.title}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}><X size={22} color={Colors.textSecondary} strokeWidth={1.8} /></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={sh.label}>AVATAR (emoji)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {EMOJI_OPTIONS.map((em) => (
                <TouchableOpacity
                  key={em}
                  style={[sh.emojiBtn, avatar === em && sh.emojiBtnActive]}
                  onPress={() => setAvatar(em)} activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 24 }}>{em}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[sh.emojiBtn, avatar === '' && sh.emojiBtnActive]}
                onPress={() => setAvatar('')} activeOpacity={0.7}
              >
                <Text style={[sh.emojiClear, avatar === '' && { color: Colors.primary }]}>ABC</Text>
              </TouchableOpacity>
            </ScrollView>

            <Text style={sh.label}>USERNAME</Text>
            <TextInput style={sh.input} value={username} onChangeText={setUsername} placeholder="Your name" placeholderTextColor={Colors.textTertiary} />

            <Text style={sh.label}>DATE OF BIRTH (YYYY-MM-DD)</Text>
            <TextInput style={sh.input} value={dob} onChangeText={setDob} placeholder="e.g. 2000-06-15" placeholderTextColor={Colors.textTertiary} />

            <Text style={sh.label}>OCCUPATION</Text>
            <TextInput style={sh.input} value={occupation} onChangeText={setOccupation} placeholder="e.g. Software Engineer" placeholderTextColor={Colors.textTertiary} />

            <TouchableOpacity style={sh.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={sh.saveBtnText}>Save Profile</Text>
            </TouchableOpacity>
            <View style={{ height: 24 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function StaggerRow({ children, delay }: { children: React.ReactNode; delay: number }) {
  const opacity    = useSharedValue(0);
  const translateX = useSharedValue(-12);

  useEffect(() => {
    opacity.value    = withDelay(delay, withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) }));
    translateX.value = withDelay(delay, withTiming(0, { duration: 280, easing: Easing.out(Easing.quad) }));
  }, []);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={anim}>{children}</Animated.View>;
}

function SettingsRow({ label, value, onPress, chevron = true }: {
  label: string; value?: string; onPress?: () => void; chevron?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {chevron && onPress ? <ChevronRight size={18} color={Colors.textTertiary} strokeWidth={1.8} /> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authMethod, setAuthMethod] = useState<string>('—');
  const [editVisible, setEditVisible] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false, message: '', type: 'success',
  });

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ visible: true, message, type });
  }

  function load() {
    setProfile(getProfile() ?? null);
    const m = getAuthMethod();
    setAuthMethod(m === 'biometric' ? 'Biometric (Fingerprint)' : m === 'pin' ? 'PIN' : '—');
    setLastBackup(getLastBackupAt());
  }

  useEffect(() => { load(); }, []);

  async function handleBackup() {
    try {
      await performBackup();
      load();
      showToast('Backup saved to Downloads', 'success');
    } catch (e: any) {
      if (e?.message !== 'cancelled') {
        showToast('Backup failed. Check storage permissions.', 'error');
      }
    }
  }

  async function handleShare() {
    try {
      await shareBackup();
      showToast('Backup shared successfully', 'success');
    } catch {
      showToast('Could not share the backup file.', 'error');
    }
  }

  async function handleRestore() {
    Alert.alert(
      'Restore Data',
      'This will replace ALL your current data. This cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue', style: 'destructive',
          onPress: async () => {
            const result = await pickAndValidateBackup();
            if (!result.ok) {
              if (result.error !== 'cancelled') showToast(result.error, 'error');
              return;
            }
            const date = new Date(result.exportedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            Alert.alert(
              'Confirm Restore',
              `Restore data from backup dated ${date}? All current data will be replaced.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Restore', style: 'destructive',
                  onPress: () => {
                    applyRestore(result.data);
                    load();
                    showToast('Data restored successfully', 'success');
                    setTimeout(() => router.replace('/'), 1200);
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }

  function formatBackupTime(iso: string | null) {
    if (!iso) return 'Never';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  const ROWS = [
    { section: 'PROFILE',       delay: 0   },
    { section: 'PREFERENCES',   delay: 40  },
    { section: 'SECURITY',      delay: 80  },
    { section: 'CATEGORIES',    delay: 120 },
    { section: 'DATA & BACKUP', delay: 160 },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} activeOpacity={0.7}>
          <ChevronLeft size={26} color={Colors.textPrimary} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Settings</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <StaggerRow delay={0}>
          <Text style={styles.sectionHeader}>PROFILE</Text>
          <View style={styles.card}>
            <SettingsRow label="Edit Profile" onPress={() => setEditVisible(true)} />
          </View>
        </StaggerRow>

        <StaggerRow delay={40}>
          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>PREFERENCES</Text>
          <View style={styles.card}>
            <SettingsRow label="Currency" value="₹ Indian Rupee" chevron={false} />
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Lock size={16} color={Colors.textSecondary} strokeWidth={1.8} />
                <Text style={styles.rowLabel}>App Lock</Text>
              </View>
              <Text style={styles.rowValue}>{authMethod} (mandatory)</Text>
            </View>
          </View>
        </StaggerRow>

        <StaggerRow delay={80}>
          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>CATEGORIES</Text>
          <View style={styles.card}>
            <SettingsRow label="Manage Categories" onPress={() => router.push('/categories')} />
          </View>
        </StaggerRow>

        <StaggerRow delay={120}>
          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>DATA & BACKUP</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Last Backup</Text>
              <Text style={styles.rowValue}>{formatBackupTime(lastBackup)}</Text>
            </View>
            <View style={styles.divider} />
            <SettingsRow label="Backup Now" onPress={handleBackup} />
            <View style={styles.divider} />
            <SettingsRow label="Share Backup" onPress={handleShare} />
            <View style={styles.divider} />
            <SettingsRow label="Restore from Backup" onPress={handleRestore} />
          </View>
        </StaggerRow>

        <View style={{ height: 60 }} />
      </ScrollView>

      <EditProfileSheet
        visible={editVisible}
        profile={profile}
        onClose={() => setEditVisible(false)}
        onSaved={() => { setEditVisible(false); load(); }}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.appBackground },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  navTitle: { ...Typography.h3, color: Colors.textPrimary },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  sectionHeader: { ...Typography.sectionHeader, color: Colors.textTertiary, marginBottom: 10 },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden', ...Shadows.card,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  rowLabel: { ...Typography.body1, color: Colors.textPrimary },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { ...Typography.body2, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.borderDefault, marginHorizontal: 16 },
});

const sh = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%', paddingHorizontal: 20, paddingBottom: 8, ...Shadows.modal,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.borderDefault, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault, marginBottom: 16 },
  title: { ...Typography.h3, color: Colors.textPrimary },
  label: { ...Typography.sectionHeader, color: Colors.textTertiary, marginBottom: 8 },
  emojiBtn: {
    width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.appBackground, marginRight: 8, borderWidth: 1.5, borderColor: Colors.borderDefault,
  },
  emojiBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  emojiClear: { fontFamily: FontFamily.semiBold, fontSize: 11, color: Colors.textTertiary },
  input: {
    backgroundColor: '#F3F4F6', borderRadius: 12, height: 52, paddingHorizontal: 16,
    fontFamily: FontFamily.regular, fontSize: 15, color: Colors.textPrimary,
    borderWidth: 1, borderColor: 'transparent', marginBottom: 16,
  },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveBtnText: { ...Typography.button, color: '#fff' },
});
