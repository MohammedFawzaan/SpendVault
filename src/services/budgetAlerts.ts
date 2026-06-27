import { getBudgetsWithProgress } from '@/db/queries/budgets';
import { sendBudgetWarningNotification, sendBudgetExceededNotification } from './notifications';
import { currentMonthYear } from '@/utils/date';

const _notifiedWarning  = new Set<number>();
const _notifiedExceeded = new Set<number>();

export function checkBudgetAlerts(): void {
  const { month, year } = currentMonthYear();
  const budgets = getBudgetsWithProgress(month, year);

  for (const b of budgets) {
    if (b.isExceeded && !_notifiedExceeded.has(b.id)) {
      _notifiedExceeded.add(b.id);
      sendBudgetExceededNotification(b.categoryName, Math.abs(b.remaining)).catch(() => {});
    } else if (b.isWarning && !_notifiedWarning.has(b.id)) {
      _notifiedWarning.add(b.id);
      sendBudgetWarningNotification(b.categoryName, b.percentUsed, b.remaining).catch(() => {});
    }
  }
}
