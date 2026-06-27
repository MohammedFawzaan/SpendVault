import SmsListener from 'react-native-android-sms-listener';
import { isBankSender, parseSms } from './smsParser';
import { sendSmsDetectedNotification } from './notifications';
import { createTransaction } from '@/db/queries/transactions';
import { isSmsPermissionGranted } from '@/db/queries/config';

function extractMonthYear(isoDate: string): { month: number; year: number } {
  const d = new Date(isoDate);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export async function processSmsMessage(
  address: string,
  body: string,
  timestamp: number,
): Promise<void> {
  if (!isSmsPermissionGranted()) return;
  if (!isBankSender(address)) return;

  const parsed = parseSms(body, timestamp);
  if (!parsed) return;

  const { month, year } = extractMonthYear(parsed.date);

  createTransaction({
    amount: parsed.amount,
    type: parsed.type,
    nature: parsed.type === 'debit' ? 'expense' : 'income',
    who: null,
    what: null,
    date: parsed.date,
    whereLocation: null,
    why: null,
    paymentMethod: parsed.upiRef ? 'upi' : 'bank_transfer',
    categoryId: null,
    note: null,
    month,
    year,
    source: 'sms',
    confirmed: false,
    upiRef: parsed.upiRef ?? null,
  });

  await sendSmsDetectedNotification(parsed.amount, parsed.type);
}

export function startSmsListener(): () => void {
  const subscription = SmsListener.addListener((message) => {
    processSmsMessage(
      message.originatingAddress,
      message.body,
      message.timestamp,
    ).catch(() => {});
  });
  return () => subscription.remove();
}
