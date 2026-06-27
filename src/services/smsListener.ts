import { isSmsPermissionGranted } from '@/db/queries/config';
import { createTransaction } from '@/db/queries/transactions';
import SmsAndroid from 'react-native-get-sms-android';
import { sendSmsDetectedNotification } from './notifications';
import { isBankSender, parseSms } from './smsParser';

function extractMonthYear(isoDate: string): { month: number; year: number } {
  const d = new Date(isoDate);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export async function scanRecentSms(): Promise<void> {
  if (!isSmsPermissionGranted()) return;

  const filter = {
    box: 'inbox',
    minDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
    maxCount: 50,
  };

  return new Promise((resolve) => {
    SmsAndroid.list(
      JSON.stringify(filter),
      () => resolve(),
      (_count: number, smsList: string) => {
        try {
          const messages: Array<{ address: string; body: string; date: number }> = JSON.parse(smsList);
          for (const msg of messages) {
            if (!isBankSender(msg.address)) continue;
            const parsed = parseSms(msg.body, msg.date);
            if (!parsed) continue;

            const { month, year } = extractMonthYear(parsed.date);

            const defaultCategoryId = 1;

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
              categoryId: defaultCategoryId,
              note: null,
              month,
              year,
              source: 'sms',
              confirmed: false,
              upiRef: parsed.upiRef ?? null,
            });

            sendSmsDetectedNotification(parsed.amount, parsed.type).catch(() => { });
          }
        } catch {
        }
        resolve();
      },
    );
  });
}
