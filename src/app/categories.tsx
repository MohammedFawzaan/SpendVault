import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ChevronLeft, Plus, Pencil, Trash2, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { Shadows } from '@/constants/spacing';
import { db } from '@/db';
import { categories, type Category } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { now } from '@/utils/date';

const COLOR_SWATCHES = [
  '#FF6B6B','#4ECDC4','#A855F7','#F59E0B','#EF4444',
  '#EC4899','#4CAF82','#3B82F6','#10B981','#6B7280',
  '#F97316','#14B8A6','#8B5CF6','#D97706','#0EA5E9',
];

const EMOJI_ICONS = [
  '🍽️','🚗','🛍️','💡','🏥','🎬','💰','💻','🎁','📦',
  '🏠','📚','✈️','🎮','🏋️','🐶','🌿','💊','🎵','🛒',
  '☕','🍕','🚌','⚡','📱','💳','🎂','🌐','🏦','📊',
];

const TYPE_OPTIONS: Array<{ label: string; value: 'expense' | 'income' | 'both' }> = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income',  value: 'income'  },
  { label: 'Both',    value: 'both'    },
];

function CategorySheet({ visible, existing, onClose, onSaved }: {
  visible: boolean;
  existing?: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName]   = useState(existing?.name ?? '');
  const [icon, setIcon]   = useState(existing?.icon ?? '📦');
  const [color, setColor] = useState(existing?.color ?? '#6B7280');
  const [type, setType]   = useState<'expense' | 'income' | 'both'>(
    (existing?.type as 'expense' | 'income' | 'both') ?? 'expense'
  );

  const slideY  = useSharedValue(600);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setName(existing?.name ?? '');
      setIcon(existing?.icon ?? '📦');
      setColor(existing?.color ?? '#6B7280');
      setType((existing?.type as 'expense' | 'income' | 'both') ?? 'expense');
      slideY.value  = withSpring(0, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      slideY.value  = withTiming(600, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle    = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  function handleSave() {
    if (!name.trim()) { Alert.alert('Error', 'Category name is required.'); return; }
    if (existing) {
      db.update(categories)
        .set({ name: name.trim(), icon, color, type })
        .where(eq(categories.id, existing.id))
        .run();
    } else {
      db.insert(categories)
        .values({ name: name.trim(), icon, color, type, isDefault: false, createdAt: now() })
        .run();
    }
    onSaved();
  }

  if (!visible) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={sh.overlay}>
        <Animated.View style={[sh.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[sh.sheet, sheetStyle]}>
          <View style={sh.handle} />
          <View style={sh.header}>
            <Text style={sh.title}>{existing ? 'Edit Category' : 'Add Category'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}><X size={22} color={Colors.textSecondary} strokeWidth={1.8} /></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={sh.label}>NAME</Text>
            <TextInput
              style={sh.input} value={name} onChangeText={setName}
              placeholder="Category name" placeholderTextColor={Colors.textTertiary}
            />

            <Text style={sh.label}>ICON</Text>
            <View style={sh.emojiGrid}>
              {EMOJI_ICONS.map((em) => (
                <TouchableOpacity
                  key={em}
                  style={[sh.emojiBtn, icon === em && { borderColor: color, backgroundColor: color + '22' }]}
                  onPress={() => setIcon(em)} activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 22 }}>{em}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={sh.label}>COLOR</Text>
            <View style={sh.swatchGrid}>
              {COLOR_SWATCHES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[sh.swatch, { backgroundColor: c }, color === c && sh.swatchActive]}
                  onPress={() => setColor(c)} activeOpacity={0.7}
                />
              ))}
            </View>

            <Text style={sh.label}>TYPE</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[sh.typeBtn, type === opt.value && { borderColor: Colors.primary, backgroundColor: Colors.primaryLight }]}
                  onPress={() => setType(opt.value)} activeOpacity={0.7}
                >
                  <Text style={[sh.typeBtnText, type === opt.value && { color: Colors.primary }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[sh.preview, { backgroundColor: color + '22', borderColor: color }]}>
              <Text style={{ fontSize: 28 }}>{icon}</Text>
              <Text style={{ ...Typography.body1, color, fontFamily: FontFamily.semiBold, marginLeft: 10 }}>
                {name || 'Preview'}
              </Text>
            </View>

            <TouchableOpacity style={sh.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={sh.saveBtnText}>{existing ? 'Save Changes' : 'Create Category'}</Text>
            </TouchableOpacity>
            <View style={{ height: 24 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function CategoryRow({ cat, onEdit, onDelete }: {
  cat: Category; onEdit: () => void; onDelete?: () => void;
}) {
  return (
    <View style={styles.catRow}>
      <View style={[styles.catIconWrap, { backgroundColor: cat.color + '22' }]}>
        <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
      </View>
      <View style={styles.catInfo}>
        <Text style={styles.catName}>{cat.name}</Text>
        <Text style={styles.catType}>{cat.type}</Text>
      </View>
      <View style={styles.catActions}>
        <TouchableOpacity onPress={onEdit} hitSlop={8} activeOpacity={0.7}>
          <Pencil size={18} color={Colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
        {onDelete ? (
          <TouchableOpacity onPress={onDelete} hitSlop={8} activeOpacity={0.7} style={{ marginLeft: 14 }}>
            <Trash2 size={18} color={Colors.danger} strokeWidth={1.8} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default function CategoriesScreen() {
  const [defaultCats, setDefaultCats] = useState<Category[]>([]);
  const [userCats, setUserCats]       = useState<Category[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editCat, setEditCat]           = useState<Category | null>(null);

  function load() {
    const all = db.select().from(categories).all();
    setDefaultCats(all.filter((c) => c.isDefault));
    setUserCats(all.filter((c) => !c.isDefault));
  }

  useEffect(() => { load(); }, []);

  function handleDelete(cat: Category) {
    Alert.alert('Delete Category', `Delete "${cat.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { db.delete(categories).where(eq(categories.id, cat.id)).run(); load(); },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} activeOpacity={0.7}>
          <ChevronLeft size={26} color={Colors.textPrimary} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Categories</Text>
        <TouchableOpacity
          onPress={() => { setEditCat(null); setSheetVisible(true); }}
          hitSlop={12} activeOpacity={0.7}
        >
          <Plus size={24} color={Colors.primary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionHeader}>DEFAULT CATEGORIES</Text>
        <View style={styles.card}>
          {defaultCats.map((cat, i) => (
            <View key={cat.id}>
              {i > 0 && <View style={styles.divider} />}
              <CategoryRow
                cat={cat}
                onEdit={() => { setEditCat(cat); setSheetVisible(true); }}
              />
            </View>
          ))}
        </View>

        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>MY CATEGORIES</Text>
        {userCats.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No custom categories yet</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => { setEditCat(null); setSheetVisible(true); }}
              activeOpacity={0.8}
            >
              <Plus size={16} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.addBtnText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            {userCats.map((cat, i) => (
              <View key={cat.id}>
                {i > 0 && <View style={styles.divider} />}
                <CategoryRow
                  cat={cat}
                  onEdit={() => { setEditCat(cat); setSheetVisible(true); }}
                  onDelete={() => handleDelete(cat)}
                />
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      <CategorySheet
        visible={sheetVisible}
        existing={editCat}
        onClose={() => setSheetVisible(false)}
        onSaved={() => { setSheetVisible(false); load(); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.appBackground },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  navTitle: { ...Typography.h3, color: Colors.textPrimary },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  sectionHeader: { ...Typography.sectionHeader, color: Colors.textTertiary, marginBottom: 10 },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden', ...Shadows.card,
  },
  catRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
  },
  catIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  catInfo: { flex: 1 },
  catName: { ...Typography.body1, color: Colors.textPrimary },
  catType: { ...Typography.caption, color: Colors.textTertiary, marginTop: 1, textTransform: 'capitalize' },
  catActions: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1, backgroundColor: Colors.borderDefault, marginHorizontal: 16 },

  empty: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  emptyText: { ...Typography.body2, color: Colors.textSecondary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.primaryLight,
  },
  addBtnText: { ...Typography.label, color: Colors.primary },
});

const sh = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%', paddingHorizontal: 20, paddingBottom: 8, ...Shadows.modal,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.borderDefault, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault, marginBottom: 16 },
  title: { ...Typography.h3, color: Colors.textPrimary },
  label: { ...Typography.sectionHeader, color: Colors.textTertiary, marginBottom: 8 },
  input: {
    backgroundColor: '#F3F4F6', borderRadius: 12, height: 52, paddingHorizontal: 16,
    fontFamily: FontFamily.regular, fontSize: 15, color: Colors.textPrimary,
    borderWidth: 1, borderColor: 'transparent', marginBottom: 16,
  },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  emojiBtn: {
    width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.appBackground, borderWidth: 1.5, borderColor: Colors.borderDefault,
  },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: Colors.textPrimary },
  typeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.borderDefault, backgroundColor: Colors.appBackground,
  },
  typeBtnText: { ...Typography.label, color: Colors.textSecondary },
  preview: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 12, borderWidth: 1.5, marginBottom: 20,
  },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { ...Typography.button, color: '#fff' },
});
