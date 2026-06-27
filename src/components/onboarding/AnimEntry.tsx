import { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming } from 'react-native-reanimated';

type Props = { delay: number; children: React.ReactNode };

export default function AnimEntry({ delay, children }: Props) {
  const ty = useSharedValue(30);
  const op = useSharedValue(0);
  useEffect(() => {
    ty.value = withDelay(delay, withSpring(0, { damping: 20 }));
    op.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }], opacity: op.value }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
