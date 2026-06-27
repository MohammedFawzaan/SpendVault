// Backup JSON validation (DATABASE_SCHEMA.md — Backup Validation Rules)

export interface BackupFile {
  version: string;
  exported_at: string;
  data: {
    user_profile: unknown;
    transactions: unknown[];
    categories: unknown[];
    budgets: unknown[];
    savings_goals: unknown[];
    config: unknown[];
  };
}

export type ValidationResult =
  | { ok: true;  backup: BackupFile }
  | { ok: false; error: string };

const SUPPORTED_VERSIONS = ['1.0'];
const REQUIRED_DATA_KEYS: (keyof BackupFile['data'])[] = [
  'user_profile', 'transactions', 'categories', 'budgets', 'savings_goals', 'config',
];

export function validateBackupFile(raw: string): ValidationResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Invalid file format. The file is not valid JSON.' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'Not a SpendVault backup file.' };
  }

  const obj = parsed as Record<string, unknown>;

  if (!('version' in obj)) {
    return { ok: false, error: 'Not a SpendVault backup file.' };
  }

  if (!SUPPORTED_VERSIONS.includes(String(obj['version']))) {
    return { ok: false, error: `Backup version "${obj['version']}" is not supported by this app.` };
  }

  if (!('data' in obj) || typeof obj['data'] !== 'object' || obj['data'] === null) {
    return { ok: false, error: 'Backup file is incomplete or corrupted.' };
  }

  const data = obj['data'] as Record<string, unknown>;
  for (const key of REQUIRED_DATA_KEYS) {
    if (!(key in data)) {
      return { ok: false, error: 'Backup file is incomplete or corrupted.' };
    }
  }

  return { ok: true, backup: parsed as BackupFile };
}
