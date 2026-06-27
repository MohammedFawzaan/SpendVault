declare module 'react-native-get-sms-android' {
  interface SmsFilter {
    box?: 'inbox' | 'sent' | 'draft' | 'outbox' | 'failed' | 'queued';
    minDate?: number;
    maxDate?: number;
    address?: string;
    bodyRegex?: string;
    maxCount?: number;
    indexFrom?: number;
  }

  const SmsAndroid: {
    list(
      filter: string,
      failureCallback: (error: string) => void,
      successCallback: (count: number, smsList: string) => void,
    ): void;
  };

  export default SmsAndroid;
}
