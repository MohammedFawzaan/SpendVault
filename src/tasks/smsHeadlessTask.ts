import { initializeDatabase } from '@/db';
import { processSmsMessage } from '@/services/smsListener';

interface SmsTaskData {
  originatingAddress: string;
  body: string;
  timestamp: number;
}

export default async function smsHeadlessTask(taskData: SmsTaskData | null): Promise<void> {
  if (!taskData) return;
  initializeDatabase();
  const { originatingAddress, body, timestamp } = taskData;
  await processSmsMessage(originatingAddress, body, timestamp);
}
