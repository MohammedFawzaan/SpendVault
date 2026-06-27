import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function sendSmsDetectedNotification(amount: number, type: 'debit' | 'credit'): Promise<void> {
  const sign = type === 'debit' ? 'debited' : 'credited';
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Transaction Detected',
      body: `₹${amount.toLocaleString('en-IN')} ${sign} — tap to complete the details`,
      data: { type: 'sms_detected' },
    },
    trigger: null,
  });
}

export async function sendBudgetWarningNotification(categoryName: string, pct: number, remaining: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Budget Warning',
      body: `${categoryName} budget at ${pct}% — ₹${remaining.toLocaleString('en-IN')} remaining this month`,
      data: { type: 'budget_warning' },
    },
    trigger: null,
  });
}

export async function sendBudgetExceededNotification(categoryName: string, over: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Budget Exceeded',
      body: `${categoryName} budget exceeded by ₹${over.toLocaleString('en-IN')}`,
      data: { type: 'budget_exceeded' },
    },
    trigger: null,
  });
}
