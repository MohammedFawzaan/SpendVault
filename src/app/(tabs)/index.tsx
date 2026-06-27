import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { currentMonthYear, formatMonthYear } from '@/utils/date';
import { formatCurrency } from '@/utils/currency';
import {
  getDashboardStats,
  getRecentTransactions,
  deleteTransaction,
  type TransactionWithCategory,
} from '@/db/queries/transactions';
import { getProfile } from '@/db/queries/userProfile';
import { TransactionCard } from '@/components/transactions/TransactionCard';
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal';

export default function HomeTab() {
  const { month, year } = currentMonthYear();
  const [stats, setStats] = useState({
    realIncome: 0, realExpenses: 0, savings: 0,
    savingsPct: 0, totalLent: 0, totalBorrowed: 0, topCategory: null as any,
  });
  const [recent, setRecent]   = useState<TransactionWithCategory[]>([]);
  const [username, setUsername] = useState('');
  const [selected, setSelected] = useState<TransactionWithCategory | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setStats(getDashboardStats(month, year));
    setRecent(getRecentTransactions(10));
    const p = getProfile();
    if (p) setUsername(p.username);
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  function onRefresh() { setRefreshing(true); load(); setRefreshing(false); }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}, {username || '…'}</Text>
            <Text style={styles.period}>{formatMonthYear(month, year)}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(username || 'U')[0].toUpperCase()}</Text>
          </View>
        </View>

        {/* Summary card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Month · {formatMonthYear(month, year)}</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Income</Text>
            <Text style={[styles.cardAmount, { color: Colors.credit }]}>{formatCurrency(stats.realIncome)}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Expenses</Text>
            <Text style={[styles.cardAmount, { color: Colors.debit }]}>{formatCurrency(stats.realExpenses)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Savings</Text>
            <View style={styles.savingsRight}>
              <Text style={[styles.cardAmount, { color: Colors.primary }]}>{formatCurrency(stats.savings)}</Text>
              <View style={styles.pctBadge}>
                <Text style={styles.pctText}>{stats.savingsPct}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Lent / Borrowed */}
        <View style={styles.sideRow}>
          <View style={styles.sideCard}>
            <Text style={styles.sideLabel}>Lent</Text>
            <Text style={[styles.sideAmount, { color: Colors.warning }]}>{formatCurrency(stats.totalLent)}</Text>
            <Text style={styles.sideSub}>pending</Text>
          </View>
          <View style={styles.sideCard}>
            <Text style={styles.sideLabel}>Borrowed</Text>
            <Text style={[styles.sideAmount, { color: Colors.debit }]}>{formatCurrency(stats.totalBorrowed)}</Text>
            <Text style={styles.sideSub}>pending</Text>
          </View>
        </View>

        {/* Recent */}
        <Text style={styles.sectionHeader}>RECENT</Text>
        {recent.length === 0 ? (
          <View style={styles.emptyRecent}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyText}>No transactions yet — tap + to add one</Text>
          </View>
        ) : (
          recent.map((tx) => (
            <TransactionCard
              key={tx.id}
              item={tx}
              onPress={() => setSelected(tx)}
              onDelete={() => { deleteTransaction(tx.id); load(); }}
            />
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
  period:   { ...Typography.body2, color: Colors.textSecondary, marginTop: 2 },
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
  cardLabel:  { ...Typography.body1, color: Colors.textSecondary },
  cardAmount: { ...Typography.amountMedium },
  divider:    { height: 1, backgroundColor: Colors.borderDefault, marginVertical: 8 },
  savingsRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pctBadge: {
    backgroundColor: Colors.primaryLight, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  pctText: { ...Typography.label, color: Colors.primaryDark },

  sideRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  sideCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  sideLabel:  { ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 },
  sideAmount: { ...Typography.amountMedium, marginBottom: 2 },
  sideSub:    { ...Typography.caption, color: Colors.textTertiary },

  sectionHeader: { ...Typography.sectionHeader, color: Colors.textTertiary, marginBottom: 10 },

  emptyRecent: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyIcon:   { fontSize: 40 },
  emptyText:   { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center' },
});
