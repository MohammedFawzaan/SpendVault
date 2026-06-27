import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { X, Pencil, Trash2 } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { formatCurrency, formatWithSign } from '@/utils/currency';
import { formatDateTime } from '@/utils/date';
import { getNatureLabel } from '@/constants/natures';
import { deleteTransaction } from '@/db/queries/transactions';
import type { TransactionWithCategory } from '@/db/queries/transactions';
import { EditTransactionModal } from '@/components/transactions/EditTransactionModal';

interface Props {
  item: TransactionWithCategory | null;
  onClose: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function TransactionDetailModal({ item, onClose, onDeleted, onUpdated }: Props) {
  const slideY  = useSharedValue(600);
  const opacity = useSharedValue(0);
  const [editVisible, setEditVisible] = useState(false);

  useEffect(() => {
    if (item) {
      slideY.value  = withSpring(0, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      slideY.value  = withTiming(600, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [item]);

  const sheetStyle   = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  function handleDelete() {
    Alert.alert(
      'Delete Transaction',
      'Delete this transaction? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (!item) return;
            deleteTransaction(item.id);
            onDeleted();
          },
        },
      ]
    );
  }

  if (!item) return null;

  const isCredit = item.type === 'credit';

  return (
    <>
      <Modal visible={!!item} transparent animationType="none" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>

          <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.badges}>
                <View style={[styles.badge, { backgroundColor: isCredit ? Colors.primaryLight : Colors.debitLight }]}>
                  <Text style={[styles.badgeText, { color: isCredit ? Colors.primaryDark : Colors.danger }]}>
                    {item.type.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: Colors.appBackground }]}>
                  <Text style={[styles.badgeText, { color: Colors.textSecondary }]}>
                    {getNatureLabel(item.nature as any)}
                  </Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity onPress={() => setEditVisible(true)} hitSlop={12}>
                  <Pencil size={20} color={Colors.primary} strokeWidth={1.8} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} hitSlop={12}>
                  <X size={20} color={Colors.textSecondary} strokeWidth={1.8} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount */}
            <Text style={[styles.amount, { color: isCredit ? Colors.credit : Colors.debit }]}>
              {formatWithSign(item.amount, item.type)}
            </Text>

            <View style={styles.divider} />

            <ScrollView showsVerticalScrollIndicator={false}>
              <Row label="Who"      value={item.who} />
              <Row label="What"     value={item.what} />
              <Row label="When"     value={formatDateTime(item.date)} />
              <Row label="Where"    value={item.whereLocation} />
              <Row label="Why"      value={item.why} />
              <Row label="How"      value={item.paymentMethod.replace('_', ' ')} />
              <Row label="Category" value={item.categoryName ? `${item.categoryIcon} ${item.categoryName}` : null} />
              <Row label="Note"     value={item.note} />
              <Row label="UPI Ref"  value={item.upiRef} />
              <Row label="Source"   value={item.source === 'sms' ? 'SMS auto-parsed' : 'Manual'} />

              <View style={styles.divider} />

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => setEditVisible(true)} activeOpacity={0.8}>
                  <Pencil size={16} color={Colors.primary} strokeWidth={1.8} />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
                  <Trash2 size={16} color={Colors.danger} strokeWidth={1.8} />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <EditTransactionModal
        item={editVisible ? item : null}
        onClose={() => setEditVisible(false)}
        onSaved={() => { setEditVisible(false); onUpdated(); onClose(); }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingHorizontal: 20,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderDefault,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badges: { flexDirection: 'row', gap: 8 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { ...Typography.label },
  headerRight: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  amount: {
    fontFamily: FontFamily.bold,
    fontSize: 36,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderDefault,
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    gap: 12,
  },
  rowLabel: {
    ...Typography.body2,
    color: Colors.textSecondary,
    width: 80,
  },
  rowValue: {
    ...Typography.body2,
    color: Colors.textPrimary,
    flex: 1,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  editBtnText: { ...Typography.button, color: Colors.primary },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.debitLight,
  },
  deleteBtnText: { ...Typography.button, color: Colors.danger },
});
