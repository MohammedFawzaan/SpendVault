import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SectionList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Search, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { Shadows } from '@/constants/spacing';
import {
  getTransactionsByNature,
  searchTransactions,
  deleteTransaction,
  type TransactionWithCategory,
} from '@/db/queries/transactions';
import { getTransactionDateLabel } from '@/utils/date';
import { formatCurrency } from '@/utils/currency';
import { TransactionCard } from '@/components/transactions/TransactionCard';
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal';

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

interface Props {
  nature: string;
  title: string;
  amountColor: string;
  emptyIcon: string;
  emptyText: string;
}

export function NatureHistoryScreen({ nature, title, amountColor, emptyIcon, emptyText }: Props) {
  const [txs, setTxs]       = useState<TransactionWithCategory[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [selected, setSelected]   = useState<TransactionWithCategory | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const total = useMemo(() => txs.reduce((s, t) => s + t.amount, 0), [txs]);

  const load = useCallback(() => {
    setTxs(getTransactionsByNature(nature));
  }, [nature]);

  useEffect(() => { load(); }, [load]);

  function onRefresh() { setRefreshing(true); load(); setRefreshing(false); }

  const displayed = useMemo(() => {
    if (searchQ.trim()) return searchTransactions(searchQ);
    return txs;
  }, [searchQ, txs]);

  const sections = useMemo(() => groupByDate(displayed), [displayed]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} activeOpacity={0.7}>
          <ChevronLeft size={26} color={Colors.textPrimary} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={() => setSearching((s) => !s)} hitSlop={12} activeOpacity={0.7}>
          <Search size={22} color={searching ? Colors.primary : Colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {searching && (
        <View style={styles.searchBar}>
          <Search size={16} color={Colors.textTertiary} strokeWidth={1.8} />
          <TextInput
            style={styles.searchInput}
            value={searchQ}
            onChangeText={setSearchQ}
            placeholder="Search transactions…"
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

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total {title}</Text>
        <Text style={[styles.summaryAmount, { color: amountColor }]}>{formatCurrency(total)}</Text>
        <Text style={styles.summaryCount}>{txs.length} transaction{txs.length !== 1 ? 's' : ''}</Text>
      </View>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{emptyIcon}</Text>
          <Text style={styles.emptyTitle}>No {title.toLowerCase()} transactions</Text>
          <Text style={styles.emptySub}>{emptyText}</Text>
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
              onDelete={() => { deleteTransaction(item.id); load(); }}
            />
          )}
        />
      )}

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

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  title: { ...Typography.h2, color: Colors.textPrimary },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: Colors.surface, borderRadius: 12,
    paddingHorizontal: 14, height: 44,
    borderWidth: 1.5, borderColor: Colors.borderFocus,
  },
  searchInput: {
    flex: 1, fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textPrimary,
  },

  summaryCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    ...Shadows.card,
  },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 },
  summaryAmount: { ...Typography.amountLarge, marginBottom: 2 },
  summaryCount: { ...Typography.caption, color: Colors.textTertiary },

  list: { paddingHorizontal: 16, paddingBottom: 100 },
  sectionHeader: {
    ...Typography.sectionHeader, color: Colors.textTertiary,
    marginTop: 16, marginBottom: 8,
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 80 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary },
  emptySub: { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
});
