import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { X, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import {
  DEBIT_NATURES,
  CREDIT_NATURES,
  PAYMENT_METHODS,
  type TransactionType,
  type Nature,
  type PaymentMethod,
} from '@/constants/natures';
import { createTransaction } from '@/db/queries/transactions';
import { db } from '@/db';
import { categories, type Category } from '@/db/schema';
import { now, extractMonthYear } from '@/utils/date';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Pre-fill for SMS flow */
  prefill?: {
    amount?: number;
    type?: TransactionType;
    date?: string;
    upiRef?: string;
    source?: 'sms' | 'manual';
  };
}

const EMPTY_FORM = {
  who: '',
  what: '',
  where: '',
  why: '',
  note: '',
};

export function AddTransactionModal({ visible, onClose, onSaved, prefill }: Props) {
  const [type, setType]       = useState<TransactionType>('debit');
  const [amount, setAmount]   = useState('');
  const [nature, setNature]   = useState<Nature>('expense');
  const [method, setMethod]   = useState<PaymentMethod>('upi');
  const [catId, setCatId]     = useState<number | null>(null);
  const [date, setDate]       = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [errors, setErrors]   = useState<Record<string, boolean>>({});
  const [cats, setCats]       = useState<Category[]>([]);

  const slideY   = useSharedValue(600);
  const opacity  = useSharedValue(0);
  // shake values per field
  const shakeWho  = useSharedValue(0);
  const shakeWhat = useSharedValue(0);
  const shakeAmt  = useSharedValue(0);
  const shakeCat  = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // load categories
      const all = db.select().from(categories).all();
      setCats(all);

      // apply prefill
      if (prefill) {
        if (prefill.amount)  setAmount(String(prefill.amount));
        if (prefill.type)    setType(prefill.type);
        if (prefill.date)    setDate(new Date(prefill.date));
      }
      // smooth enter animation
      slideY.value = withTiming(0, {
        duration: 320,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
      opacity.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.quad),
      });
    } else {
      // smooth exit animation
      slideY.value = withTiming(600, {
        duration: 250,
        easing: Easing.in(Easing.quad),
      });
      opacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.quad),
      });
    }
  }, [visible]);

  useEffect(() => {
    // reset nature when type changes
    setNature(type === 'debit' ? 'expense' : 'income');
  }, [type]);

  function shake(sv: SharedValue<number>) {
    sv.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }

  function handleSave() {
    const newErrors: Record<string, boolean> = {};
    const amt = parseFloat(amount);

    if (!amount || isNaN(amt) || amt <= 0) { newErrors.amount = true; shake(shakeAmt); }
    if (!form.who.trim())  { newErrors.who  = true; shake(shakeWho);  }
    if (!form.what.trim()) { newErrors.what = true; shake(shakeWhat); }
    if (!catId)            { newErrors.cat  = true; shake(shakeCat);  }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const iso = date.toISOString();
    const { month, year } = extractMonthYear(iso);

    createTransaction({
      amount: amt,
      type,
      nature,
      who: form.who.trim(),
      what: form.what.trim(),
      date: iso,
      whereLocation: form.where.trim() || null,
      why: form.why.trim() || null,
      paymentMethod: method,
      categoryId: catId,
      note: form.note.trim() || null,
      month,
      year,
      source: prefill?.source ?? 'manual',
      confirmed: true,
      upiRef: prefill?.upiRef ?? null,
    });

    // reset
    setAmount(''); setForm(EMPTY_FORM); setCatId(null);
    setType('debit'); setNature('expense'); setMethod('upi');
    setErrors({}); setDate(new Date());
    onSaved();
  }

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  const shakeAmtStyle  = useAnimatedStyle(() => ({ transform: [{ translateX: shakeAmt.value  }] }));
  const shakeWhoStyle  = useAnimatedStyle(() => ({ transform: [{ translateX: shakeWho.value  }] }));
  const shakeWhatStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeWhat.value }] }));
  const shakeCatStyle  = useAnimatedStyle(() => ({ transform: [{ translateX: shakeCat.value  }] }));

  const natures = type === 'debit' ? DEBIT_NATURES : CREDIT_NATURES;

  const filteredCats = cats.filter(
    (c) => c.type === 'both' ||
      (type === 'debit'  && c.type === 'expense') ||
      (type === 'credit' && c.type === 'income')
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Transaction</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <X size={22} color={Colors.textSecondary} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Type toggle */}
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'debit' && styles.typeBtnDebit]}
                onPress={() => setType('debit')}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeBtnText, type === 'debit' && styles.typeBtnTextActive]}>
                  DEBIT
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'credit' && styles.typeBtnCredit]}
                onPress={() => setType('credit')}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeBtnText, type === 'credit' && styles.typeBtnTextActive]}>
                  CREDIT
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <Animated.View style={[styles.amountRow, shakeAmtStyle]}>
              <Text style={[styles.rupee, errors.amount && { color: Colors.danger }]}>₹</Text>
              <TextInput
                style={[styles.amountInput, errors.amount && { color: Colors.danger }]}
                value={amount}
                onChangeText={(v) => { setAmount(v); setErrors((e) => ({ ...e, amount: false })); }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Colors.textTertiary}
              />
            </Animated.View>
            {errors.amount && <Text style={styles.errText}>Enter an amount</Text>}

            {/* Nature pills */}
            <Text style={styles.sectionLabel}>NATURE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {natures.map((n) => (
                <TouchableOpacity
                  key={n.value}
                  style={[styles.pill, nature === n.value && styles.pillActive]}
                  onPress={() => setNature(n.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, nature === n.value && styles.pillTextActive]}>
                    {n.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Who */}
            <Text style={styles.sectionLabel}>WHO *</Text>
            <Animated.View style={shakeWhoStyle}>
              <TextInput
                style={[styles.input, errors.who && styles.inputError]}
                value={form.who}
                onChangeText={(v) => { setForm((f) => ({ ...f, who: v })); setErrors((e) => ({ ...e, who: false })); }}
                placeholder="Person or merchant name"
                placeholderTextColor={Colors.textTertiary}
              />
            </Animated.View>
            {errors.who && <Text style={styles.errText}>This field is required</Text>}

            {/* What */}
            <Text style={styles.sectionLabel}>WHAT *</Text>
            <Animated.View style={shakeWhatStyle}>
              <TextInput
                style={[styles.input, errors.what && styles.inputError]}
                value={form.what}
                onChangeText={(v) => { setForm((f) => ({ ...f, what: v })); setErrors((e) => ({ ...e, what: false })); }}
                placeholder="What was this for?"
                placeholderTextColor={Colors.textTertiary}
              />
            </Animated.View>
            {errors.what && <Text style={styles.errText}>This field is required</Text>}

            {/* Category */}
            <Text style={styles.sectionLabel}>CATEGORY *</Text>
            <Animated.View style={shakeCatStyle}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                {filteredCats.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.catPill, catId === c.id && { borderColor: c.color, backgroundColor: c.color + '22' }]}
                    onPress={() => { setCatId(c.id); setErrors((e) => ({ ...e, cat: false })); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.catIcon}>{c.icon}</Text>
                    <Text style={[styles.catLabel, catId === c.id && { color: c.color }]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
            {errors.cat && <Text style={styles.errText}>Pick a category</Text>}

            {/* Payment method */}
            <Text style={styles.sectionLabel}>HOW *</Text>
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.methodBtn, method === m.value && styles.methodBtnActive]}
                  onPress={() => setMethod(m.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.methodText, method === m.value && styles.methodTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date */}
            <Text style={styles.sectionLabel}>DATE & TIME</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Calendar size={16} color={Colors.textSecondary} strokeWidth={1.8} />
              <Text style={styles.dateBtnText}>
                {date.toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="datetime"
                display="default"
                onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d); }}
              />
            )}

            {/* Optional fields */}
            <Text style={styles.sectionLabel}>WHERE</Text>
            <TextInput
              style={styles.input}
              value={form.where}
              onChangeText={(v) => setForm((f) => ({ ...f, where: v }))}
              placeholder="Location or platform (optional)"
              placeholderTextColor={Colors.textTertiary}
            />

            <Text style={styles.sectionLabel}>WHY</Text>
            <TextInput
              style={styles.input}
              value={form.why}
              onChangeText={(v) => setForm((f) => ({ ...f, why: v }))}
              placeholder="Purpose or reason (optional)"
              placeholderTextColor={Colors.textTertiary}
            />

            <Text style={styles.sectionLabel}>NOTE</Text>
            <TextInput
              style={[styles.input, { height: 64 }]}
              value={form.note}
              onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
              placeholder="Any additional context (optional)"
              placeholderTextColor={Colors.textTertiary}
              multiline
            />

            {/* Save */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Save Transaction</Text>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
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
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDefault,
    marginBottom: 16,
  },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },

  // type toggle
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.appBackground,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  typeBtnDebit:  { backgroundColor: Colors.debit },
  typeBtnCredit: { backgroundColor: Colors.credit },
  typeBtnText:  { ...Typography.label, color: Colors.textSecondary },
  typeBtnTextActive: { color: '#fff' },

  // amount
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    gap: 4,
  },
  rupee: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    color: Colors.textSecondary,
  },
  amountInput: {
    fontFamily: FontFamily.bold,
    fontSize: 40,
    color: Colors.textPrimary,
    minWidth: 100,
    textAlign: 'center',
  },

  sectionLabel: {
    ...Typography.sectionHeader,
    color: Colors.textTertiary,
    marginTop: 16,
    marginBottom: 8,
  },

  // nature / method pills
  pillRow: { marginBottom: 4 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.appBackground,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  pillText: { ...Typography.label, color: Colors.textSecondary },
  pillTextActive: { color: Colors.primary },

  // category pills
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.appBackground,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: Colors.borderDefault,
  },
  catIcon: { fontSize: 16 },
  catLabel: { ...Typography.label, color: Colors.textSecondary },

  // payment method
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  methodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.appBackground,
    borderWidth: 1.5,
    borderColor: Colors.borderDefault,
  },
  methodBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  methodText: { ...Typography.label, color: Colors.textSecondary },
  methodTextActive: { color: Colors.primary },

  // inputs
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 4,
  },
  inputError: {
    borderColor: Colors.borderError,
    backgroundColor: Colors.debitLight,
  },
  errText: {
    ...Typography.caption,
    color: Colors.danger,
    marginBottom: 4,
  },

  // date
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  dateBtnText: { ...Typography.body2, color: Colors.textPrimary },

  // save
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveBtnText: { ...Typography.button, color: '#fff' },
});
