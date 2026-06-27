import { NatureHistoryScreen } from '@/components/NatureHistoryScreen';
import { Colors } from '@/constants/colors';

export default function BorrowedHistoryScreen() {
  return (
    <NatureHistoryScreen
      nature="borrowed"
      title="Borrowed"
      amountColor={Colors.debit}
      emptyIcon="💳"
      emptyText="Transactions where you borrowed money will appear here"
    />
  );
}
