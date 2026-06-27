import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/spacing';
import { FontFamily, Typography } from '@/constants/typography';
import { db } from '@/db';
import {
  createBudget,
  deleteBudget,
  getBudgetsWithProgress,
  updateBudget,
  type BudgetWithProgress,
} from '@/db/queries/budgets';
import {
  addToSavedAmount,
  completeGoal,
  createGoal,
  deleteGoal,
  getGoals,
  updateGoal,
} from '@/db/queries/goals';
import { categories, type Category, type SavingsGoal } from '@/db/schema';
import { formatCurrency, formatINR } from '@/utils/currency';
import { currentMonthYear, formatDeadline } from '@/utils/date';
import { eq, or } from 'drizzle-orm';
import { router } from 'expo-router';
import { Flag, Plus, Target, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type AlertButton,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

function StaggerItem({ children, delay }: { children: React.ReactNode; delay: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 200 }));
  }, []);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
  return <Animated.View style={anim}>{children}</Animated.View>;
}

function BudgetCard({ budget, index, onEdit, onDelete, onPress }: {
  budget: BudgetWithProgress;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onPress: () => void;
}) {
  const borderColor = useSharedValue<string>(budget.isExceeded ? Colors.danger : Colors.borderDefault);

  useEffect(() => {
    if (budget.isExceeded) {
      borderColor.value = withRepeat(
        withSequence(withTiming('#FF0000', { duration: 400 }), withTiming(Colors.danger, { duration: 400 })),
        3, true
      );
    }
  }, [budget.isExceeded]);

  const cardStyle = useAnimatedStyle(() => ({ borderColor: borderColor.value, borderWidth: budget.isExceeded ? 1.5 : 0 }));

  const pctColor = budget.isExceeded ? Colors.danger : budget.isWarning ? Colors.warning : Colors.primary;

  return (
    <StaggerItem delay={index * 60}>
      <Animated.View style={[styles.card, cardStyle]}>
        <TouchableOpacity
          onPress={onPress}
          onLongPress={() =>
            Alert.alert(budget.categoryName, '', [
              { text: 'Edit', onPress: onEdit },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
          activeOpacity={0.8}
        >
          <View style={styles.budgetHeader}>
            <View style={styles.budgetLeft}>
              <Text style={styles.catIcon}>{budget.categoryIcon}</Text>
              <Text style={styles.budgetCatName}>{budget.categoryName}</Text>
            </View>
            <Text style={[styles.budgetPct, { color: pctColor }]}>{budget.percentUsed}%</Text>
          </View>

          <View style={styles.budgetRow}>
            <Text style={styles.budgetMeta}>
              <Text style={{ color: pctColor, fontFamily: FontFamily.semiBold }}>
                ₹{formatINR(budget.spentAmount)}
              </Text>
              {' '}spent of ₹{formatINR(budget.limitAmount)} limit
            </Text>
          </View>

          <Text style={[styles.budgetRemaining, { color: budget.isExceeded ? Colors.danger : Colors.textSecondary }]}>
            {budget.isExceeded
              ? `₹${formatINR(Math.abs(budget.remaining))} over budget`
              : `₹${formatINR(budget.remaining)} remaining`}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </StaggerItem>
  );
}

function GoalCard({ goal, index, onAddSavings, onEdit, onDelete, onComplete }: {
  goal: SavingsGoal;
  index: number;
  onAddSavings: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
}) {
  const saved = goal.savedAmount ?? 0;
  const pct = goal.targetAmount > 0 ? Math.round((saved / goal.targetAmount) * 100) : 0;
  const remaining = goal.targetAmount - saved;
  const isComplete = goal.status === 'completed';

  const flash = useSharedValue(0);
  useEffect(() => {
    if (isComplete) {
      flash.value = withSequence(withTiming(1, { duration: 200 }), withTiming(0, { duration: 400 }));
    }
  }, [isComplete]);
  const flashStyle = useAnimatedStyle(() => ({
    backgroundColor: flash.value > 0 ? Colors.primaryLight : Colors.surface,
  }));

  return (
    <StaggerItem delay={index * 60}>
      <Animated.View style={[styles.card, flashStyle]}>
        <TouchableOpacity
          onLongPress={() => {
            const btns: AlertButton[] = [
              { text: 'Edit', onPress: onEdit },
              ...(!isComplete ? [{ text: 'Mark Complete', onPress: onComplete }] : []),
              { text: 'Delete', style: 'destructive', onPress: onDelete },
              { text: 'Cancel', style: 'cancel' },
            ];
            Alert.alert(goal.title, '', btns);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.goalHeader}>
            <View style={styles.goalLeft}>
              <Flag size={18} color={isComplete ? Colors.primary : Colors.textSecondary} strokeWidth={1.8} />
              <Text style={styles.goalTitle}>{goal.title}</Text>
            </View>
            {isComplete && (
              <View style={styles.completeBadge}>
                <Text style={styles.completeBadgeText}>DONE</Text>
              </View>
            )}
          </View>

          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Target</Text>
            <Text style={styles.goalValue}>{formatCurrency(goal.targetAmount)}</Text>
          </View>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Saved</Text>
            <Text style={[styles.goalValue, { color: Colors.primary }]}>{formatCurrency(saved)}</Text>
          </View>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Remaining</Text>
            <Text style={styles.goalValue}>{formatCurrency(remaining)}</Text>
          </View>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Progress</Text>
            <Text style={[styles.goalValue, { color: Colors.primary }]}>{pct}%</Text>
          </View>
          {goal.deadline && (
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>Deadline</Text>
              <Text style={styles.goalValue}>{formatDeadline(goal.deadline)}</Text>
            </View>
          )}

          {!isComplete && (
            <TouchableOpacity style={styles.addSavingsBtn} onPress={onAddSavings} activeOpacity={0.8}>
              <Plus size={14} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.addSavingsText}>Add to Savings</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    </StaggerItem>
  );
}

function BudgetSheet({ visible, onClose, onSaved, existing }: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  existing?: BudgetWithProgress | null;
}) {
  const { month: curMonth, year: curYear } = currentMonthYear();
  const [cats, setCats] = useState<Category[]>([]);
  const [catId, setCatId] = useState<number | null>(existing?.categoryId ?? null);
  const [limit, setLimit] = useState(existing ? String(existing.limitAmount) : '');
  const [month, setMonth] = useState(existing?.month ?? curMonth);
  const [year, setYear] = useState(existing?.year ?? curYear);

  const slideY = useSharedValue(600);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      const catRows = db.select().from(categories)
        .where(or(eq(categories.type, 'expense'), eq(categories.type, 'both')))
        .all();
      setCats(catRows);
      setCatId(existing?.categoryId ?? null);
      setLimit(existing ? String(existing.limitAmount) : '');
      setMonth(existing?.month ?? curMonth);
      setYear(existing?.year ?? curYear);
      slideY.value = withSpring(0, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      slideY.value = withTiming(600, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  function handleSave() {
    const amt = parseFloat(limit);
    if (!catId || isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Pick a category and enter a valid limit.');
      return;
    }
    if (existing) {
      updateBudget(existing.id, amt);
    } else {
      createBudget({ categoryId: catId, month, year, limitAmount: amt });
    }
    onSaved();
  }

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (!visible) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={shStyles.overlay}>
        <Animated.View style={[shStyles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[shStyles.sheet, sheetStyle]}>
          <View style={shStyles.handle} />
          <View style={shStyles.header}>
            <Text style={shStyles.title}>{existing ? 'Edit Budget' : 'Add Budget'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}><X size={22} color={Colors.textSecondary} strokeWidth={1.8} /></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={shStyles.label}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {cats.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[shStyles.catPill, catId === c.id && { borderColor: c.color, backgroundColor: c.color + '22' }]}
                  onPress={() => setCatId(c.id)} activeOpacity={0.7}
                >
                  <Text style={shStyles.catIcon}>{c.icon}</Text>
                  <Text style={[shStyles.catLabel, catId === c.id && { color: c.color }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={shStyles.label}>MONTH</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={i}
                  style={[shStyles.pill, month === i + 1 && shStyles.pillActive]}
                  onPress={() => setMonth(i + 1)} activeOpacity={0.7}
                >
                  <Text style={[shStyles.pillText, month === i + 1 && shStyles.pillTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={shStyles.label}>YEAR</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {[curYear - 1, curYear, curYear + 1].map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[shStyles.pill, year === y && shStyles.pillActive]}
                  onPress={() => setYear(y)} activeOpacity={0.7}
                >
                  <Text style={[shStyles.pillText, year === y && shStyles.pillTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={shStyles.label}>LIMIT AMOUNT</Text>
            <TextInput
              style={shStyles.input}
              value={limit}
              onChangeText={setLimit}
              keyboardType="numeric"
              placeholder="e.g. 10000"
              placeholderTextColor={Colors.textTertiary}
            />

            <TouchableOpacity style={shStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={shStyles.saveBtnText}>Save Budget</Text>
            </TouchableOpacity>
            <View style={{ height: 24 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function GoalSheet({ visible, onClose, onSaved, existing }: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  existing?: SavingsGoal | null;
}) {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [target, setTarget] = useState(existing ? String(existing.targetAmount) : '');
  const [deadline, setDeadline] = useState(existing?.deadline ?? '');

  const slideY = useSharedValue(600);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setTitle(existing?.title ?? '');
      setTarget(existing ? String(existing.targetAmount) : '');
      setDeadline(existing?.deadline ?? '');
      slideY.value = withSpring(0, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      slideY.value = withTiming(600, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  function handleSave() {
    const amt = parseFloat(target);
    if (!title.trim() || isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Enter a title and a valid target amount.');
      return;
    }
    if (existing) {
      updateGoal(existing.id, { title: title.trim(), targetAmount: amt, deadline: deadline || null });
    } else {
      createGoal({ title: title.trim(), targetAmount: amt, deadline: deadline || null, savedAmount: 0, status: 'active' });
    }
    onSaved();
  }

  if (!visible) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={shStyles.overlay}>
        <Animated.View style={[shStyles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[shStyles.sheet, sheetStyle]}>
          <View style={shStyles.handle} />
          <View style={shStyles.header}>
            <Text style={shStyles.title}>{existing ? 'Edit Goal' : 'Add Goal'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}><X size={22} color={Colors.textSecondary} strokeWidth={1.8} /></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={shStyles.label}>TITLE</Text>
            <TextInput style={shStyles.input} value={title} onChangeText={setTitle} placeholder="What are you saving for?" placeholderTextColor={Colors.textTertiary} />

            <Text style={shStyles.label}>TARGET AMOUNT</Text>
            <TextInput style={shStyles.input} value={target} onChangeText={setTarget} keyboardType="numeric" placeholder="e.g. 100000" placeholderTextColor={Colors.textTertiary} />

            <Text style={shStyles.label}>DEADLINE (optional — YYYY-MM-DD)</Text>
            <TextInput style={shStyles.input} value={deadline} onChangeText={setDeadline} placeholder="e.g. 2026-12-31" placeholderTextColor={Colors.textTertiary} />

            <TouchableOpacity style={shStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={shStyles.saveBtnText}>{existing ? 'Save Changes' : 'Create Goal'}</Text>
            </TouchableOpacity>
            <View style={{ height: 24 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function AddSavingsSheet({ visible, goal, onClose, onSaved }: {
  visible: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState('');
  const slideY = useSharedValue(600);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setAmount('');
      slideY.value = withSpring(0, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      slideY.value = withTiming(600, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  function handleSave() {
    if (!goal) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    addToSavedAmount(goal.id, amt);
    onSaved();
  }

  if (!visible || !goal) return null;
  const current = goal.savedAmount ?? 0;
  const preview = current + (parseFloat(amount) || 0);

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={shStyles.overlay}>
        <Animated.View style={[shStyles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[shStyles.sheet, sheetStyle]}>
          <View style={shStyles.handle} />
          <View style={shStyles.header}>
            <Text style={shStyles.title}>Add to Savings</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}><X size={22} color={Colors.textSecondary} strokeWidth={1.8} /></TouchableOpacity>
          </View>
          <Text style={[shStyles.label, { marginTop: 8 }]}>How much have you added to this goal?</Text>
          <Text style={{ ...Typography.body2, color: Colors.textSecondary, marginBottom: 12 }}>
            Current saved: {formatCurrency(current)}
          </Text>
          <TextInput
            style={shStyles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Amount to add"
            placeholderTextColor={Colors.textTertiary}
            autoFocus
          />
          {amount.length > 0 && (
            <Text style={{ ...Typography.body2, color: Colors.primary, marginBottom: 16 }}>
              New total: {formatCurrency(preview)}
            </Text>
          )}
          <TouchableOpacity style={shStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={shStyles.saveBtnText}>Update</Text>
          </TouchableOpacity>
          <View style={{ height: 24 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function BudgetGoalsScreen() {
  const { month, year } = currentMonthYear();
  const [budgetList, setBudgetList] = useState<BudgetWithProgress[]>([]);
  const [goalList, setGoalList] = useState<SavingsGoal[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [budgetSheetVisible, setBudgetSheetVisible] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetWithProgress | null>(null);
  const [goalSheetVisible, setGoalSheetVisible] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [addSavingsGoal, setAddSavingsGoal] = useState<SavingsGoal | null>(null);

  const load = useCallback(() => {
    setBudgetList(getBudgetsWithProgress(month, year));
    setGoalList(getGoals());
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  function onRefresh() { setRefreshing(true); load(); setRefreshing(false); }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Text style={styles.screenTitle}>Budget & Goals</Text>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionHeader}>BUDGET</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => { setEditBudget(null); setBudgetSheetVisible(true); }} activeOpacity={0.8}>
            <Plus size={16} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.addBtnText}>Add Budget</Text>
          </TouchableOpacity>
        </View>

        {budgetList.length === 0 ? (
          <View style={styles.empty}>
            <Target size={40} color={Colors.textTertiary} strokeWidth={1.4} />
            <Text style={styles.emptyTitle}>No budgets set</Text>
            <Text style={styles.emptySub}>Tap + to set a monthly category budget</Text>
          </View>
        ) : (
          budgetList.map((b, i) => (
            <BudgetCard
              key={b.id} budget={b} index={i}
              onPress={() => router.push({ pathname: '/(tabs)/transactions', params: { categoryId: String(b.categoryId) } })}
              onEdit={() => { setEditBudget(b); setBudgetSheetVisible(true); }}
              onDelete={() => { Alert.alert('Delete Budget', 'Remove this budget?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { deleteBudget(b.id); load(); } }]); }}
            />
          ))
        )}

        <View style={[styles.sectionRow, { marginTop: 24 }]}>
          <Text style={styles.sectionHeader}>GOALS</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => { setEditGoal(null); setGoalSheetVisible(true); }} activeOpacity={0.8}>
            <Plus size={16} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.addBtnText}>Add Goal</Text>
          </TouchableOpacity>
        </View>

        {goalList.length === 0 ? (
          <View style={styles.empty}>
            <Flag size={40} color={Colors.textTertiary} strokeWidth={1.4} />
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptySub}>Tap + to create your first savings goal</Text>
          </View>
        ) : (
          goalList.map((g, i) => (
            <GoalCard
              key={g.id} goal={g} index={i}
              onAddSavings={() => setAddSavingsGoal(g)}
              onEdit={() => { setEditGoal(g); setGoalSheetVisible(true); }}
              onDelete={() => { Alert.alert('Delete Goal', 'Remove this goal?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { deleteGoal(g.id); load(); } }]); }}
              onComplete={() => { completeGoal(g.id); load(); }}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BudgetSheet
        visible={budgetSheetVisible}
        existing={editBudget}
        onClose={() => setBudgetSheetVisible(false)}
        onSaved={() => { setBudgetSheetVisible(false); load(); }}
      />
      <GoalSheet
        visible={goalSheetVisible}
        existing={editGoal}
        onClose={() => setGoalSheetVisible(false)}
        onSaved={() => { setGoalSheetVisible(false); load(); }}
      />
      <AddSavingsSheet
        visible={!!addSavingsGoal}
        goal={addSavingsGoal}
        onClose={() => setAddSavingsGoal(null)}
        onSaved={() => { setAddSavingsGoal(null); load(); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.appBackground },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
  screenTitle: { ...Typography.h1, color: Colors.textPrimary, marginBottom: 20 },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeader: { ...Typography.sectionHeader, color: Colors.textTertiary },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.primaryLight },
  addBtnText: { ...Typography.label, color: Colors.primary },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 10,
    ...Shadows.card,
  },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  budgetLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catIcon: { fontSize: 20 },
  budgetCatName: { ...Typography.body1, color: Colors.textPrimary },
  budgetPct: { ...Typography.h3 },
  budgetRow: { marginBottom: 4 },
  budgetMeta: { ...Typography.body2, color: Colors.textSecondary },
  budgetRemaining: { ...Typography.caption },

  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  goalLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalTitle: { ...Typography.body1, color: Colors.textPrimary },
  completeBadge: { backgroundColor: Colors.primaryLight, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  completeBadgeText: { ...Typography.label, color: Colors.primary },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  goalLabel: { ...Typography.body2, color: Colors.textSecondary },
  goalValue: { ...Typography.body2, color: Colors.textPrimary, fontFamily: FontFamily.semiBold },
  addSavingsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999,
    borderWidth: 1.5, borderColor: Colors.primary, alignSelf: 'flex-start',
  },
  addSavingsText: { ...Typography.label, color: Colors.primary },

  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary },
  emptySub: { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center' },
});

const shStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '88%', paddingHorizontal: 20, paddingBottom: 8, ...Shadows.modal,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.borderDefault, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault, marginBottom: 16 },
  title: { ...Typography.h3, color: Colors.textPrimary },
  label: { ...Typography.sectionHeader, color: Colors.textTertiary, marginBottom: 8 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999, backgroundColor: Colors.appBackground, marginRight: 8, borderWidth: 1.5, borderColor: Colors.borderDefault,
  },
  catIcon: { fontSize: 16 },
  catLabel: { ...Typography.label, color: Colors.textSecondary },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.appBackground,
    marginRight: 8, borderWidth: 1.5, borderColor: Colors.borderDefault,
  },
  pillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  pillText: { ...Typography.label, color: Colors.textSecondary },
  pillTextActive: { color: Colors.primary },
  input: {
    backgroundColor: '#F3F4F6', borderRadius: 12, height: 52, paddingHorizontal: 16,
    fontFamily: FontFamily.regular, fontSize: 15, color: Colors.textPrimary,
    borderWidth: 1, borderColor: 'transparent', marginBottom: 16,
  },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveBtnText: { ...Typography.button, color: '#fff' },
});
