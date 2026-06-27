import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { formatWithSign } from '@/utils/currency';
import { formatDateTime } from '@/utils/date';
import { getNatureLabel } from '@/constants/natures';
import type { TransactionWithCategory } from '@/db/queries/transactions';

const SWIPE_THRESHOLD = -80;
const DELETE_ZONE = -80;

interface Props {
  item: TransactionWithCategory;
  onPress: () => void;
  onDelete: () => void;
}

export function TransactionCard({ item, onPress, onDelete }: Props) {
  const translateX = useSharedValue(0);
  const deleteOpacity = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      const x = Math.max(DELETE_ZONE * 1.3, Math.min(0, e.translationX));
      translateX.value = x;
      deleteOpacity.value = Math.min(1, Math.abs(x) / Math.abs(DELETE_ZONE));
    })
    .onEnd((e) => {
      if (e.translationX < SWIPE_THRESHOLD) {
        translateX.value = withSpring(DELETE_ZONE);
      } else {
        translateX.value = withSpring(0);
        deleteOpacity.value = withTiming(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const deleteStyle = useAnimatedStyle(() => ({
    opacity: deleteOpacity.value,
  }));

  function handleDelete() {
    Alert.alert(
      'Delete Transaction',
      'Delete this transaction? This cannot be undone.',
      [
        {
          text: 'Cancel',
          onPress: () => {
            translateX.value = withSpring(0);
            deleteOpacity.value = withTiming(0);
          },
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            runOnJS(onDelete)();
          },
        },
      ]
    );
  }

  const isCredit = item.type === 'credit';
  const amountColor = isCredit ? Colors.credit : Colors.debit;

  return (
    <View style={styles.wrapper}>
      {/* Delete zone behind */}
      <Animated.View style={[styles.deleteZone, deleteStyle]}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
          <Trash2 size={22} color="#fff" strokeWidth={1.8} />
        </TouchableOpacity>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardStyle]}>
          <TouchableOpacity
            style={styles.inner}
            onPress={onPress}
            activeOpacity={0.75}
          >
            {/* Icon */}
            <View style={[styles.iconCircle, { backgroundColor: (item.categoryColor ?? '#6B7280') + '22' }]}>
              <Text style={styles.iconEmoji}>{item.categoryIcon ?? '📦'}</Text>
            </View>

            {/* Details */}
            <View style={styles.details}>
              <Text style={styles.who} numberOfLines={1}>{item.who ?? item.what ?? '—'}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {getNatureLabel(item.nature as any)}
                {item.categoryName ? ` · ${item.categoryName}` : ''}
                {' · '}{formatDateTime(item.date)}
              </Text>
            </View>

            {/* Amount */}
            <Text style={[styles.amount, { color: amountColor }]}>
              {formatWithSign(item.amount, item.type)}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
    position: 'relative',
  },
  deleteZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    borderRadius: 16,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 20 },
  details: { flex: 1 },
  who: {
    ...Typography.body1,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  meta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  amount: {
    ...Typography.amountMedium,
    textAlign: 'right',
  },
});
