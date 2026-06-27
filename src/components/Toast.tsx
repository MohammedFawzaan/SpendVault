import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
}

const CONFIG: Record<ToastType, { bg: string; iconColor: string; Icon: any }> = {
  success: { bg: Colors.primaryLight,  iconColor: Colors.primaryDark, Icon: CheckCircle },
  error:   { bg: Colors.debitLight,    iconColor: Colors.danger,      Icon: AlertTriangle },
  info:    { bg: '#F3F4F6',            iconColor: Colors.textSecondary, Icon: Info },
};

export function Toast({ visible, message, type = 'success', duration = 3000, onHide }: ToastProps) {
  const translateY = useSharedValue(120);
  const opacity    = useSharedValue(0);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      opacity.value    = withTiming(1, { duration: 200 });

      timerRef.current = setTimeout(() => {
        hide();
      }, duration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, message]);

  function hide() {
    translateY.value = withTiming(120, { duration: 280 });
    opacity.value    = withTiming(0, { duration: 250 }, (done) => {
      if (done) runOnJS(onHide)();
    });
  }

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const { bg, iconColor, Icon } = CONFIG[type];

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { backgroundColor: bg }, animStyle]}>
      <Icon size={18} color={iconColor} strokeWidth={1.8} />
      <Text style={styles.message} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  message: {
    ...Typography.body2,
    color: Colors.textPrimary,
    flex: 1,
  },
});
