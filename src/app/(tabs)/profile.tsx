import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Settings } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { Shadows } from '@/constants/spacing';
import { getProfile } from '@/db/queries/userProfile';
import { getCurrentMonthlySalary, getDashboardStats } from '@/db/queries/transactions';
import { getMonthBudgetOverview } from '@/db/queries/budgets';
import { currentMonthYear, formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/currency';
import type { UserProfile } from '@/db/schema';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function clockTimeStr(date: Date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function StatCard({ label, value, color, delay }: {
  label: string; value: string; color?: string; delay: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 200 }));
  }, []);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.statCard, anim]}>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const { month, year } = currentMonthYear();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [salary, setSalary] = useState<{ amount: number; date: string } | null>(null);
  const [budgetOverview, setBudgetOverview] = useState({ totalLimit: 0, totalSpent: 0, remaining: 0 });
  const [stats, setStats] = useState({
    realIncome: 0, realExpenses: 0, savings: 0, savingsPct: 0,
    totalLent: 0, totalBorrowed: 0, topCategory: null as any,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [prevMinute, setPrevMinute] = useState(new Date().getMinutes());

  const clockOpacity = useSharedValue(1);
  const avatarY = useSharedValue(-60);
  const avatarOpacity = useSharedValue(0);

  useEffect(() => {
    avatarY.value = withSpring(0, { damping: 14, stiffness: 160, mass: 0.9 });
    avatarOpacity.value = withTiming(1, { duration: 300 });
  }, []);

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: avatarY.value }],
    opacity: avatarOpacity.value,
  }));

  const clockStyle = useAnimatedStyle(() => ({ opacity: clockOpacity.value }));

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      if (now.getMinutes() !== prevMinute) {
        clockOpacity.value = withSequence(
          withTiming(0, { duration: 150 }),
          withTiming(1, { duration: 150 }),
        );
        setPrevMinute(now.getMinutes());
      }
      setClock(now);
    }, 1000);
    return () => clearInterval(id);
  }, [prevMinute]);

  const load = useCallback(() => {
    const p = getProfile();
    setProfile(p ?? null);
    setSalary(getCurrentMonthlySalary(month, year));
    setBudgetOverview(getMonthBudgetOverview(month, year));
    setStats(getDashboardStats(month, year));
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  function onRefresh() { setRefreshing(true); load(); setRefreshing(false); }

  const name = profile?.username ?? 'You';
  const initials = getInitials(name);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.topRow}>
          <Text style={styles.screenTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
            activeOpacity={0.8}
            hitSlop={8}
          >
            <Settings size={22} color={Colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <Animated.View style={[styles.avatarWrap, avatarStyle]}>
            {profile?.avatar ? (
              <Text style={styles.avatarEmoji}>{profile.avatar}</Text>
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </Animated.View>
          <Text style={styles.profileName}>{name}</Text>
          {profile?.occupation ? (
            <Text style={styles.profileOccupation}>{profile.occupation}</Text>
          ) : null}

          <Animated.View style={[styles.clockWrap, clockStyle]}>
            <Text style={styles.clockTime}>{clockTimeStr(clock)}</Text>
            <Text style={styles.clockDate}>
              {clock.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </Animated.View>
        </View>

        <View style={styles.salaryCard}>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>Last Income</Text>
            <Text style={[styles.salaryValue, { color: Colors.credit }]}>
              {salary ? formatCurrency(salary.amount) : '—'}
            </Text>
          </View>
          {salary ? (
            <Text style={styles.salarySub}>Credited on {formatDate(salary.date)}</Text>
          ) : null}
        </View>

        <Text style={styles.sectionHeader}>THIS MONTH</Text>

        <View style={styles.statsGrid}>
          <StatCard label="Income" value={formatCurrency(stats.realIncome)} color={Colors.credit} delay={0} />
          <StatCard label="Expenses" value={formatCurrency(stats.realExpenses)} color={Colors.debit} delay={80} />
          <StatCard label="Savings" value={formatCurrency(stats.savings)} color={Colors.primary} delay={160} />
          <StatCard label="Savings %" value={`${stats.savingsPct}%`} color={Colors.primary} delay={240} />
        </View>

        <Text style={[styles.sectionHeader, { marginTop: 20 }]}>BUDGET OVERVIEW</Text>

        <View style={styles.budgetCard}>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Total Budget</Text>
            <Text style={styles.budgetValue}>{formatCurrency(budgetOverview.totalLimit)}</Text>
          </View>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Spent</Text>
            <Text style={[styles.budgetValue, { color: Colors.debit }]}>
              {formatCurrency(budgetOverview.totalSpent)}
            </Text>
          </View>
          <View style={[styles.budgetRow, styles.budgetDividerRow]}>
            <Text style={styles.budgetLabel}>Remaining</Text>
            <Text style={[styles.budgetValue, {
              color: budgetOverview.remaining < 0 ? Colors.danger : Colors.primary,
              fontFamily: FontFamily.semiBold,
            }]}>
              {formatCurrency(Math.abs(budgetOverview.remaining))}
              {budgetOverview.remaining < 0 ? ' over' : ''}
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.appBackground },
  scroll: { paddingHorizontal: 16, paddingTop: 12 },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  screenTitle: { ...Typography.h1, color: Colors.textPrimary },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    ...Shadows.card,
  },

  profileSection: { alignItems: 'center', marginBottom: 24 },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2.5, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitials: { fontFamily: FontFamily.bold, fontSize: 28, color: Colors.primary },
  avatarEmoji: { fontSize: 40 },
  profileName: { ...Typography.h2, color: Colors.textPrimary, marginBottom: 2 },
  profileOccupation: { ...Typography.body2, color: Colors.textSecondary, marginBottom: 14 },
  clockWrap: { alignItems: 'center', marginTop: 8 },
  clockTime: { fontFamily: FontFamily.semiBold, fontSize: 28, color: Colors.textPrimary, letterSpacing: 1 },
  clockDate: { ...Typography.body2, color: Colors.textSecondary, marginTop: 2 },

  salaryCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 20,
    ...Shadows.card,
  },
  salaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  salaryLabel: { ...Typography.body1, color: Colors.textSecondary },
  salaryValue: { ...Typography.amountMedium },
  salarySub: { ...Typography.caption, color: Colors.textTertiary, marginTop: 4 },

  sectionHeader: { ...Typography.sectionHeader, color: Colors.textTertiary, marginBottom: 12 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.surface, borderRadius: 16,
    padding: 14, alignItems: 'center', ...Shadows.card,
  },
  statValue: { ...Typography.h2, color: Colors.textPrimary, marginBottom: 2 },
  statLabel: { ...Typography.caption, color: Colors.textSecondary },

  budgetCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, ...Shadows.card,
  },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  budgetDividerRow: { borderTopWidth: 1, borderTopColor: Colors.borderDefault, marginTop: 8, paddingTop: 10 },
  budgetLabel: { ...Typography.body1, color: Colors.textSecondary },
  budgetValue: { ...Typography.body1, color: Colors.textPrimary, fontFamily: FontFamily.medium },
});
