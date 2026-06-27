import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useEffect } from 'react';
import { Colors } from '@/constants/colors';

function Dot({ active }: { active: boolean }) {
  const scale = useSharedValue(active ? 1.5 : 1);
  const width = useSharedValue(active ? 20 : 8);

  useEffect(() => {
    scale.value = withSpring(active ? 1.5 : 1, { damping: 14 });
    width.value = withSpring(active ? 20 : 8, { damping: 14 });
  }, [active]);

  const style = useAnimatedStyle(() => ({
    width: width.value,
    transform: [{ scale: scale.value }],
    backgroundColor: active ? Colors.primary : Colors.borderDefault,
  }));

  return <Animated.View style={[s.dot, style]} />;
}

export default function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={s.row}>
      {Array.from({ length: total }, (_, i) => (
        <Dot key={i} active={i === current} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
