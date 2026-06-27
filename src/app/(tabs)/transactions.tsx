import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  SectionList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SlidersHorizontal, Search, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import {
  getTransactionsByMonthYear,
  searchTransactions,
  deleteTransaction,
  getMonthSummary,
  type TransactionWithCategory,
} from '@/db/queries/transactions';
import { currentMonthYear, formatMonthYear, prevMonth, nextMonth, getTransactionDateLabel } from '@/utils/date';
import { formatCurrency } from '@/utils/currency';
import { TransactionCard } from '@/components/transactions/TransactionCard';
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal';
import { FilterSheet } from '@/components/transactions/FilterSheet';
import type { FilterState } from '@/components/transactions/FilterSheet';
import { getUnconfirmedTransactions } from '@/db/queries/transactions';
import { ConfirmSmsModal } from '@/components/transactions/ConfirmSmsModal';
import { MessageSquare } from 'lucide-react-native';

interface Section {
  title: string;
  data: TransactionWithCategory[];
}

function groupByDate(txs: TransactionWithCategory[]): Section[] {
  const map = new Map<string, TransactionWithCategory[]>();
  for (const tx of txs) {
    const label = getTransactionDateLabel(tx.date);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(tx);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export default function TransactionsScreen() {
  const { month: initMonth, year: initYear } = currentMonthYear();
  const [month, setMonth] = useState(initMonth);
  const [year, setYear]   = useState(initYear);
  const [txs, setTxs]     = useState<TransactionWithCategory[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selected, setSelected] = useState<TransactionWithCategory | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({ income: 0, expenses: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [smsModalVisible, setSmsModalVisible] = useState(false);

  const load = useCallback(() => {
    const data = getTransactionsByMonthYear(month, year, filters);
    setTxs(data);
    setSummary(getMonthSummary(month, year));
    setPendingCount(getUnconfirmedTransactions().length);
  }, [month, year, filters]);

  useEffect(() => { load(); }, [load]);

  const displayed = useMemo(() => {
    if (searchQ.trim()) return searchTransactions(searchQ, month, year);
    return txs;
  }, [searchQ, txs]);

  const sections = useMemo(() => groupByDate(displayed), [displayed]);

  function handlePrev() {
    const p = prevMonth(month, year);
    setMonth(p.month); setYear(p.year);
  }
  function handleNext() {
    const n = nextMonth(month, year);
    setMonth(n.month); setYear(n.year);
  }

  function handleDelete(id: number) {
    deleteTransaction(id);
    load();
  }

  function onRefresh() {
    setRefreshing(true);
    load();
    setRefreshing(false);
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Transactions{pendingCount > 0 ? ` (${pendingCount} pending)` : ''}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, hasFilters && styles.iconBtnActive]}
            onPress={() => setFilterVisible(true)}
            hitSlop={8}
          >
            <SlidersHorizontal size={22} color={hasFilters ? Colors.primary : Colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setSearching((s) => !s)} hitSlop={8}>
            <Search size={22} color={searching ? Colors.primary : Colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      {searching && (
        <View style={styles.searchBar}>
          <Search size={16} color={Colors.textTertiary} strokeWidth={1.8} />
          <TextInput
            style={styles.searchInput}
            value={searchQ}
            onChangeText={setSearchQ}
            placeholder="Search by who, what, note…"
            placeholderTextColor={Colors.textTertiary}
            autoFocus
          />
          {searchQ.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQ('')} hitSlop={8}>
              <X size={16} color={Colors.textTertiary} strokeWidth={1.8} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Month selector */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={handlePrev} hitSlop={12}>
          <ChevronLeft size={22} color={Colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{formatMonthYear(month, year)}</Text>
        <TouchableOpacity onPress={handleNext} hitSlop={12}>
          <ChevronRight size={22} color={Colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContent}
      >
        {([
          { label: 'All',           key: undefined,          field: undefined },
          { label: 'Debit',         key: 'debit',            field: 'type' },
          { label: 'Credit',        key: 'credit',           field: 'type' },
          { label: 'Cash',          key: 'cash',             field: 'paymentMethod' },
          { label: 'UPI',           key: 'upi',              field: 'paymentMethod' },
          { label: 'Card',          key: 'card',             field: 'paymentMethod' },
          { label: 'Bank Transfer', key: 'bank_transfer',    field: 'paymentMethod' },
        ] as const).map((chip) => {
          const isActive = chip.field === undefined
            ? !filters.type && !filters.paymentMethod
            : filters[chip.field as keyof FilterState] === chip.key;
          return (
            <TouchableOpacity
              key={chip.label}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => {
                if (chip.field === undefined) {
                  setFilters({});
                } else if (chip.field === 'type') {
                  setFilters((f) => ({ ...f, type: isActive ? undefined : chip.key as 'debit' | 'credit', paymentMethod: undefined }));
                } else {
                  setFilters((f) => ({ ...f, paymentMethod: isActive ? undefined : chip.key as string, type: undefined }));
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{chip.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Pending SMS banner */}
      {pendingCount > 0 && (
        <TouchableOpacity style={styles.smsBanner} onPress={() => setSmsModalVisible(true)} activeOpacity={0.8}>
          <MessageSquare size={16} color={Colors.primary} strokeWidth={1.8} />
          <Text style={styles.smsBannerText}>
            {pendingCount} pending SMS transaction{pendingCount > 1 ? 's' : ''} — tap to complete
          </Text>
        </TouchableOpacity>
      )}

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryAmount, { color: Colors.credit }]}>{formatCurrency(summary.income)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={[styles.summaryAmount, { color: Colors.debit }]}>{formatCurrency(summary.expenses)}</Text>
        </View>
      </View>

      {/* List */}
      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No transactions</Text>
          <Text style={styles.emptySubtitle}>
            {hasFilters || searchQ ? 'Try adjusting your filters' : 'Tap + to add your first transaction'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <TransactionCard
              item={item}
              onPress={() => setSelected(item)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* Detail Modal */}
      <TransactionDetailModal
        item={selected}
        onClose={() => setSelected(null)}
        onDeleted={() => { setSelected(null); load(); }}
        onUpdated={() => { setSelected(null); load(); }}
      />

      {/* Filter Sheet */}
      <FilterSheet
        visible={filterVisible}
        current={filters}
        onApply={(f: FilterState) => { setFilters(f); }}
        onClose={() => setFilterVisible(false)}
      />

      <ConfirmSmsModal
        visible={smsModalVisible}
        onClose={() => setSmsModalVisible(false)}
        onConfirmed={() => load()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.appBackground },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: { ...Typography.h1, color: Colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  iconBtnActive: { backgroundColor: Colors.primaryLight },

  smsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: Colors.primaryLight, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.primary,
  },
  smsBannerText: { ...Typography.body2, color: Colors.primary, flex: 1 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: Colors.surface, borderRadius: 12,
    paddingHorizontal: 14, height: 44,
    borderWidth: 1.5, borderColor: Colors.borderFocus,
  },
  searchInput: {
    flex: 1, fontFamily: FontFamily.regular, fontSize: 14,
    color: Colors.textPrimary,
  },

  monthRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 16, paddingVertical: 8,
  },
  monthLabel: { ...Typography.h3, color: Colors.textPrimary },

  chipScroll: { marginBottom: 10 },
  chipContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.borderDefault,
  },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText: { ...Typography.label, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },

  summaryRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary },
  summaryAmount: { ...Typography.amountMedium },
  summaryDivider: { width: 1, backgroundColor: Colors.borderDefault },

  list: { paddingHorizontal: 16, paddingBottom: 100 },
  sectionHeader: {
    ...Typography.sectionHeader, color: Colors.textTertiary,
    marginTop: 16, marginBottom: 8,
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 80 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary },
  emptySubtitle: { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
});
