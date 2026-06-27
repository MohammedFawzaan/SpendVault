import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { DEBIT_NATURES, CREDIT_NATURES, PAYMENT_METHODS } from '@/constants/natures';
import { db } from '@/db';
import { categories, type Category } from '@/db/schema';

export interface FilterState {
  type?: 'debit' | 'credit';
  nature?: string;
  categoryId?: number;
  paymentMethod?: string;
}

interface Props {
  visible: boolean;
  current: FilterState;
  onApply: (f: FilterState) => void;
  onClose: () => void;
}

const ALL_NATURES = [...DEBIT_NATURES, ...CREDIT_NATURES].filter(
  (n, i, arr) => arr.findIndex((x) => x.value === n.value) === i
);

export function FilterSheet({ visible, current, onApply, onClose }: Props) {
  const [local, setLocal] = useState<FilterState>(current);
  const [cats, setCats]   = useState<Category[]>([]);

  const slideY  = useSharedValue(600);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      const all = db.select().from(categories).all();
      setCats(all);
      setLocal(current);
      slideY.value  = withSpring(0, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      slideY.value  = withTiming(600, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle    = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  function toggle<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setLocal((f) => ({ ...f, [key]: f[key] === value ? undefined : value }));
  }

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <X size={22} color={Colors.textSecondary} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>TYPE</Text>
            <View style={styles.pillRow}>
              {(['debit', 'credit'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.pill, local.type === t && styles.pillActive]}
                  onPress={() => toggle('type', t)} activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, local.type === t && styles.pillTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>NATURE</Text>
            <View style={styles.pillRow}>
              {ALL_NATURES.map((n) => (
                <TouchableOpacity
                  key={n.value}
                  style={[styles.pill, local.nature === n.value && styles.pillActive]}
                  onPress={() => toggle('nature', n.value)} activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, local.nature === n.value && styles.pillTextActive]}>
                    {n.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>CATEGORY</Text>
            <View style={styles.pillRow}>
              {cats.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.pill, local.categoryId === c.id && styles.pillActive]}
                  onPress={() => toggle('categoryId', c.id)} activeOpacity={0.7}
                >
                  <Text style={styles.pillText}>{c.icon} {c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>METHOD</Text>
            <View style={styles.pillRow}>
              {PAYMENT_METHODS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.pill, local.paymentMethod === m.value && styles.pillActive]}
                  onPress={() => toggle('paymentMethod', m.value)} activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, local.paymentMethod === m.value && styles.pillTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.clearBtn} onPress={() => setLocal({})} activeOpacity={0.8}>
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => { onApply(local); onClose(); }}
                activeOpacity={0.85}
              >
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 24 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '88%', paddingHorizontal: 20, paddingBottom: 8,
    elevation: 16,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.borderDefault,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault, marginBottom: 16,
  },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  sectionLabel: { ...Typography.sectionHeader, color: Colors.textTertiary, marginTop: 16, marginBottom: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: Colors.appBackground, borderWidth: 1.5, borderColor: Colors.borderDefault,
  },
  pillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  pillText: { ...Typography.label, color: Colors.textSecondary },
  pillTextActive: { color: Colors.primary },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  clearBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.borderDefault,
    alignItems: 'center', justifyContent: 'center',
  },
  clearBtnText: { ...Typography.button, color: Colors.textSecondary },
  applyBtn: {
    flex: 2, backgroundColor: Colors.primary, borderRadius: 12,
    height: 48, alignItems: 'center', justifyContent: 'center',
  },
  applyBtnText: { ...Typography.button, color: '#fff' },
});
