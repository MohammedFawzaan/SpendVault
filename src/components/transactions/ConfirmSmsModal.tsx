import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Pressable, Alert } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { X, MessageSquare, Check } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { Shadows } from '@/constants/spacing';
import { getUnconfirmedTransactions, deleteTransaction, type TransactionWithCategory } from '@/db/queries/transactions';
import { formatCurrency } from '@/utils/currency';
import { formatDateTime } from '@/utils/date';
import { AddTransactionModal } from './AddTransactionModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirmed: () => void;
}

export function ConfirmSmsModal({ visible, onClose, onConfirmed }: Props) {
  const [pending, setPending] = useState<TransactionWithCategory[]>([]);
  const [selected, setSelected] = useState<TransactionWithCategory | null>(null);

  const slideY  = useSharedValue(600);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setPending(getUnconfirmedTransactions());
      slideY.value  = withSpring(0, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      slideY.value  = withTiming(600, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle    = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  function handleDiscard(tx: TransactionWithCategory) {
    Alert.alert('Discard', 'Remove this unconfirmed SMS transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard', style: 'destructive',
        onPress: () => {
          deleteTransaction(tx.id);
          const updated = pending.filter((p) => p.id !== tx.id);
          setPending(updated);
          if (updated.length === 0) onClose();
        },
      },
    ]);
  }

  if (!visible) return null;

  return (
    <>
      <Modal visible transparent animationType="none" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <MessageSquare size={18} color={Colors.primary} strokeWidth={1.8} />
                <Text style={styles.title}>SMS Transactions</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{pending.length}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <X size={22} color={Colors.textSecondary} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>
              These transactions were auto-detected from your bank SMS. Complete the details to save them.
            </Text>

            <FlatList
              data={pending}
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={[styles.typeBadge, { backgroundColor: item.type === 'debit' ? Colors.debitLight : Colors.primaryLight }]}>
                      <Text style={[styles.typeBadgeText, { color: item.type === 'debit' ? Colors.debit : Colors.credit }]}>
                        {item.type.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.smsBadge}>
                      <MessageSquare size={12} color={Colors.textTertiary} strokeWidth={1.8} />
                      <Text style={styles.smsBadgeText}>SMS</Text>
                    </View>
                  </View>

                  <Text style={[styles.amount, { color: item.type === 'debit' ? Colors.debit : Colors.credit }]}>
                    {item.type === 'debit' ? '−' : '+'}{formatCurrency(item.amount)}
                  </Text>
                  <Text style={styles.dateText}>{formatDateTime(item.date)}</Text>
                  {item.upiRef && <Text style={styles.upiRef}>UPI Ref: {item.upiRef}</Text>}

                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.discardBtn} onPress={() => handleDiscard(item)} activeOpacity={0.8}>
                      <X size={14} color={Colors.danger} strokeWidth={2} />
                      <Text style={styles.discardText}>Discard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.completeBtn}
                      onPress={() => { setSelected(item); }}
                      activeOpacity={0.8}
                    >
                      <Check size={14} color="#fff" strokeWidth={2} />
                      <Text style={styles.completeText}>Complete Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </Animated.View>
        </View>
      </Modal>

      {selected && (
        <AddTransactionModal
          visible={!!selected}
          prefill={{
            amount: selected.amount,
            type: selected.type as 'debit' | 'credit',
            date: selected.date,
            upiRef: selected.upiRef ?? undefined,
            source: 'sms',
          }}
          onClose={() => setSelected(null)}
          onSaved={() => {
            if (selected) deleteTransaction(selected.id);
            setSelected(null);
            const updated = getUnconfirmedTransactions();
            setPending(updated);
            onConfirmed();
            if (updated.length === 0) onClose();
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%', paddingHorizontal: 20, paddingBottom: 8, ...Shadows.modal,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.borderDefault, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault, marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...Typography.h3, color: Colors.textPrimary },
  countBadge: { backgroundColor: Colors.primaryLight, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { ...Typography.label, color: Colors.primary },
  subtitle: { ...Typography.body2, color: Colors.textSecondary, marginBottom: 16, lineHeight: 20 },

  card: { backgroundColor: Colors.appBackground, borderRadius: 16, padding: 14, marginBottom: 10, ...Shadows.card },
  cardTop: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  typeBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  typeBadgeText: { fontFamily: FontFamily.semiBold, fontSize: 11 },
  smsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  smsBadgeText: { ...Typography.caption, color: Colors.textTertiary },

  amount: { fontFamily: FontFamily.bold, fontSize: 26, marginBottom: 4 },
  dateText: { ...Typography.body2, color: Colors.textSecondary, marginBottom: 2 },
  upiRef: { ...Typography.caption, color: Colors.textTertiary, marginBottom: 10 },

  cardActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  discardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1.5, borderColor: Colors.danger,
  },
  discardText: { ...Typography.label, color: Colors.danger },
  completeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.primary,
  },
  completeText: { ...Typography.label, color: '#fff' },
});
