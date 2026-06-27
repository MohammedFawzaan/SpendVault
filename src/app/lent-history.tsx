import { NatureHistoryScreen } from '@/components/NatureHistoryScreen';
import { Colors } from '@/constants/colors';

export default function LentHistoryScreen() {
  return (
    <NatureHistoryScreen
      nature="lent"
      title="Lent"
      amountColor={Colors.warning}
      emptyIcon="🤝"
      emptyText="Transactions where you lent money will appear here"
    />
  );
}
