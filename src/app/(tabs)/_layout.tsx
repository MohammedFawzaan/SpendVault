import { Tabs } from 'expo-router';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Home, List, Target, User, Plus } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';
import { useEffect, useState } from 'react';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { getUnconfirmedTransactions } from '@/db/queries/transactions';

type TabName = 'index' | 'transactions' | 'budget-goals' | 'profile';

const TABS: { name: TabName; label: string; Icon: any }[] = [
  { name: 'index',        label: 'Home',        Icon: Home   },
  { name: 'transactions', label: 'Transactions', Icon: List   },
  { name: 'budget-goals', label: 'Budget',       Icon: Target },
  { name: 'profile',      label: 'Profile',      Icon: User   },
];

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setPendingCount(getUnconfirmedTransactions().length);
  }, [state.index]);

  // map expo-router state index → our tab names
  // route order in state: index(0), transactions(1), budget-goals(2), profile(3)
  const activeRouteName = state.routes[state.index]?.name as TabName;

  return (
    <>
      <View style={[styles.bar, { paddingBottom: insets.bottom || 8 }]}>
        {/* Left two tabs */}
        {TABS.slice(0, 2).map((tab) => (
          <TabItem
            key={tab.name}
            tab={tab}
            isActive={activeRouteName === tab.name}
            onPress={() => navigation.navigate(tab.name)}
            badge={tab.name === 'transactions' && pendingCount > 0 ? pendingCount : 0}
          />
        ))}

        {/* FAB center slot */}
        <View style={styles.fabSlot}>
          <TouchableOpacity
            style={styles.fab}
            activeOpacity={0.85}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={28} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Right two tabs */}
        {TABS.slice(2).map((tab) => (
          <TabItem
            key={tab.name}
            tab={tab}
            isActive={activeRouteName === tab.name}
            onPress={() => navigation.navigate(tab.name)}
          />
        ))}
      </View>

      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={() => setModalVisible(false)}
      />
    </>
  );
}

function TabItem({
  tab,
  isActive,
  onPress,
  badge = 0,
}: {
  tab: { name: TabName; label: string; Icon: any };
  isActive: boolean;
  onPress: () => void;
  badge?: number;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePress() {
    scale.value = withSpring(1.12, { damping: 10 }, () => {
      scale.value = withSpring(1);
    });
    onPress();
  }

  return (
    <TouchableOpacity style={styles.tabItem} onPress={handlePress} activeOpacity={0.8}>
      {isActive && <View style={styles.activeIndicator} />}
      <Animated.View style={[animStyle, { position: 'relative' }]}>
        <tab.Icon
          size={22}
          color={isActive ? Colors.primary : Colors.textTertiary}
          strokeWidth={1.8}
        />
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </Animated.View>
      <Text
        style={[styles.tabLabel, isActive && styles.tabLabelActive]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="budget-goals" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDefault,
    paddingTop: 4,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 2,
    gap: 2,
  },
  activeIndicator: {
    position: 'absolute',
    top: -4,
    width: 24,
    height: 3,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  tabLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  tabLabelActive: {
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
  badge: {
    position: 'absolute', top: -4, right: -6,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.danger, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontFamily: FontFamily.bold, fontSize: 9, color: '#fff' },
  fabSlot: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
