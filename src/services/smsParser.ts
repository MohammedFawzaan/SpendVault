export interface ParsedSms {
  amount: number;
  type: 'debit' | 'credit';
  upiRef: string | null;
  date: string;
}

const BANK_SENDERS = [
  'HDFCBK', 'ICICIBK', 'SBIINB', 'AXISBK', 'KOTAKB', 'PNBSMS', 'BOBTXN',
  'CBSSBI', 'INDBNK', 'YESBNK', 'IDBIBK', 'RBLBNK', 'FEDBK', 'SCBSMS',
  'PAYTMB', 'GPAYSM', 'PHONEPE', 'ATMSBI', 'SMSSBI', 'SBIPSG',
  'AM-HDFCBK', 'AM-ICICIB', 'AM-AXISBK', 'VM-HDFCBK', 'VK-ICICIB',
];

const DEBIT_PATTERNS = [
  /(?:debited|deducted|spent|paid|withdrawn|sent)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:debited|deducted|spent|paid|withdrawn|sent)/i,
  /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:has been deducted|has been debited)/i,
];

const CREDIT_PATTERNS = [
  /(?:credited|received|deposited|refunded|added)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:credited|received|deposited|refunded)/i,
  /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:has been credited|has been added)/i,
];

const UPI_REF_PATTERNS = [
  /(?:upi\s*ref(?:erence)?\s*(?:no\.?|number)?|ref\s*no\.?|txn\s*id|transaction\s*id)[:\s]*([A-Za-z0-9]{10,})/i,
  /(?:ref|utr)[:\s]*([0-9]{10,})/i,
];

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, ''));
}

export function isBankSender(address: string): boolean {
  const upper = address.toUpperCase().replace(/[-\s]/g, '');
  return BANK_SENDERS.some((s) => upper.includes(s.replace(/-/g, '')));
}

export function parseSms(body: string, receivedAt: number): ParsedSms | null {
  let amount: number | null = null;
  let type: 'debit' | 'credit' | null = null;

  for (const pattern of DEBIT_PATTERNS) {
    const m = body.match(pattern);
    if (m) { amount = parseAmount(m[1]); type = 'debit'; break; }
  }

  if (!amount) {
    for (const pattern of CREDIT_PATTERNS) {
      const m = body.match(pattern);
      if (m) { amount = parseAmount(m[1]); type = 'credit'; break; }
    }
  }

  if (!amount || !type || amount <= 0) return null;

  let upiRef: string | null = null;
  for (const p of UPI_REF_PATTERNS) {
    const m = body.match(p);
    if (m) { upiRef = m[1]; break; }
  }

  const date = new Date(receivedAt).toISOString();

  return { amount, type, upiRef, date };
}
