import { TransactionCard } from '@/components/transactions/TransactionCard';
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import {
  deleteTransaction,
  getDashboardStats,
  getRecentTransactions,
  type TransactionWithCategory,
} from '@/db/queries/transactions';
import { getProfile } from '@/db/queries/userProfile';
import { formatINR } from '@/utils/currency';
import { currentMonthYear, formatMonthYear } from '@/utils/date';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// Animated card that fades + slides up with a stagger delay
function StaggerCard({ children, delay, style }: { children: React.ReactNode; delay: number; style?: any }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 180 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

// Animated number — count-up via requestAnimationFrame, re-runs when target changes
function AnimatedAmount({
  value,
  color,
  style,
  prefix = '₹',
  delay = 0,
}: {
  value: number;
  color?: string;
  style?: any;
  prefix?: string;
  delay?: number;
}) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  const DURATION = 800;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fromRef.current = displayed;
      startRef.current = null;

      function step(ts: number) {
        if (startRef.current === null) startRef.current = ts;
        const elapsed = ts - startRef.current;
        const progress = Math.min(elapsed / DURATION, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayed(Math.round(fromRef.current + (value - fromRef.current) * eased));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          setDisplayed(value);
        }
      }
      rafRef.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  const formatted = `${prefix}${formatINR(Math.abs(displayed))}`;

  return <Text style={[style, color ? { color } : {}]}>{formatted}</Text>;
}

export default function HomeTab() {
  const { month, year } = currentMonthYear();
  const [stats, setStats] = useState({
    realIncome: 0, realExpenses: 0, savings: 0,
    savingsPct: 0, totalLent: 0, totalBorrowed: 0, topCategory: null as any,
  });
  const [recent, setRecent] = useState<TransactionWithCategory[]>([]);
  const [username, setUsername] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('');
  const [selected, setSelected] = useState<TransactionWithCategory | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  const greetOpacity = useSharedValue(0);
  const greetStyle = useAnimatedStyle(() => ({ opacity: greetOpacity.value }));

  const load = useCallback(() => {
    setStats(getDashboardStats(month, year));
    setRecent(getRecentTransactions(10));
    const p = getProfile();
    if (p) { setUsername(p.username); setAvatarEmoji(p.avatar ?? ''); }
    greetOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    setTick((t) => t + 1);
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  function onRefresh() {
    setRefreshing(true);
    greetOpacity.value = 0;
    load();
    setRefreshing(false);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header — greeting fades in */}
        <Animated.View style={[styles.header, greetStyle]}>
          <View>
            <Text style={styles.greeting}>{greeting}, {username || '…'}</Text>
            <Text style={styles.period}>{formatMonthYear(month, year)}</Text>
          </View>
          <View style={styles.avatar}>
            {avatarEmoji ? (
              <Text style={{ fontSize: 24 }}>{avatarEmoji}</Text>
            ) : (
              <Text style={styles.avatarText}>{(username || 'U')[0].toUpperCase()}</Text>
            )}
          </View>
        </Animated.View>

        {/* Main summary card — stagger 0ms */}
        <StaggerCard delay={0}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>This Month · {formatMonthYear(month, year)}</Text>

            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Income</Text>
              <AnimatedAmount key={`inc-${tick}`} value={stats.realIncome} color={Colors.credit} style={styles.cardAmount} delay={0} />
            </View>

            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Expenses</Text>
              <AnimatedAmount key={`exp-${tick}`} value={stats.realExpenses} color={Colors.debit} style={styles.cardAmount} delay={100} />
            </View>

            <View style={styles.divider} />

            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Savings</Text>
              <View style={styles.savingsRight}>
                <AnimatedAmount key={`sav-${tick}`} value={stats.savings} color={Colors.primary} style={styles.cardAmount} delay={200} />
                <View style={styles.pctBadge}>
                  <Text style={styles.pctText}>{stats.savingsPct}%</Text>
                </View>
              </View>
            </View>

            {stats.topCategory && (
              <>
                <View style={styles.divider} />
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Top Category</Text>
                  <Text style={[styles.cardAmount, { color: Colors.debit }]}>
                    {stats.topCategory.name}{'  '}
                    <Text style={styles.cardAmount}>₹{formatINR(stats.topCategory.amount)}</Text>
                  </Text>
                </View>
              </>
            )}
          </View>
        </StaggerCard>

        {/* Lent / Borrowed — stagger 60ms */}
        <StaggerCard delay={60}>
          <View style={styles.sideRow}>
            <TouchableOpacity style={styles.sideCard} onPress={() => router.push('/lent-history')} activeOpacity={0.8}>
              <Text style={styles.sideLabel}>Lent</Text>
              <AnimatedAmount key={`lent-${tick}`} value={stats.totalLent} color={Colors.warning} style={styles.sideAmount} delay={120} />
              <Text style={styles.sideSub}>tap to view</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sideCard} onPress={() => router.push('/borrowed-history')} activeOpacity={0.8}>
              <Text style={styles.sideLabel}>Borrowed</Text>
              <AnimatedAmount key={`bor-${tick}`} value={stats.totalBorrowed} color={Colors.debit} style={styles.sideAmount} delay={180} />
              <Text style={styles.sideSub}>tap to view</Text>
            </TouchableOpacity>
          </View>
        </StaggerCard>

        {/* Recent header */}
        <StaggerCard delay={120}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionHeader}>RECENT</Text>
            {recent.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')} hitSlop={8}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            )}
          </View>
        </StaggerCard>

        {/* Recent list — each item staggers */}
        {recent.length === 0 ? (
          <StaggerCard delay={160}>
            <View style={styles.emptyRecent}>
              <Text style={styles.emptyIcon}>💸</Text>
              <Text style={styles.emptyText}>No transactions yet — tap + to add one</Text>
            </View>
          </StaggerCard>
        ) : (
          recent.map((tx, i) => (
            <StaggerCard key={tx.id} delay={160 + i * 50}>
              <TransactionCard
                item={tx}
                onPress={() => setSelected(tx)}
                onDelete={() => { deleteTransaction(tx.id); load(); }}
              />
            </StaggerCard>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TransactionDetailModal
        item={selected}
        onClose={() => setSelected(null)}
        onDeleted={() => { setSelected(null); load(); }}
        onUpdated={() => { setSelected(null); load(); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.appBackground },
  scroll: { paddingHorizontal: 16, paddingTop: 12 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  greeting: { ...Typography.h2, color: Colors.textPrimary },
  period: { ...Typography.body2, color: Colors.textSecondary, marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: Colors.primary },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  cardTitle: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 12 },
  cardRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 6,
  },
  cardLabel: { ...Typography.body1, color: Colors.textSecondary },
  cardAmount: { ...Typography.amountMedium },
  divider: { height: 1, backgroundColor: Colors.borderDefault, marginVertical: 8 },
  savingsRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pctBadge: {
    backgroundColor: Colors.primaryLight, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  pctText: { ...Typography.label, color: Colors.primaryDark },

  sideRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  sideCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  sideLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 },
  sideAmount: { ...Typography.amountMedium, marginBottom: 2 },
  sideSub: { ...Typography.caption, color: Colors.textTertiary },

  recentHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  sectionHeader: { ...Typography.sectionHeader, color: Colors.textTertiary },
  seeAll: { ...Typography.body2, color: Colors.primary },

  emptyRecent: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center' },
});
