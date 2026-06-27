import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { db } from '@/db';
import { userProfile, transactions, categories, budgets, savingsGoals, config } from '@/db/schema';
import { setLastBackupAt } from '@/db/queries/config';
import { now } from '@/utils/date';

const BACKUP_VERSION = '1.0';
const BACKUP_FILENAME = 'spendvault-backup.json';

function backupPath(): string {
  return (FileSystem.documentDirectory ?? '') + BACKUP_FILENAME;
}

interface BackupData {
  version: string;
  exportedAt: string;
  userProfile: any[];
  transactions: any[];
  categories: any[];
  budgets: any[];
  savingsGoals: any[];
  config: any[];
}

function collectData(): BackupData {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    userProfile:   db.select().from(userProfile).all(),
    transactions:  db.select().from(transactions).all(),
    categories:    db.select().from(categories).all(),
    budgets:       db.select().from(budgets).all(),
    savingsGoals:  db.select().from(savingsGoals).all(),
    config:        db.select().from(config).all(),
  };
}

export async function performBackup(): Promise<void> {
  const json = JSON.stringify(collectData(), null, 2);
  await FileSystem.writeAsStringAsync(backupPath(), json, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  setLastBackupAt(now());
}

export async function shareBackup(): Promise<void> {
  await performBackup();
  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(backupPath(), {
      mimeType: 'application/json',
      dialogTitle: 'Share SpendVault Backup',
    });
  }
}

export type RestoreResult =
  | { ok: false; error: string }
  | { ok: true; exportedAt: string; data: BackupData };

export async function pickAndValidateBackup(): Promise<RestoreResult> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (picked.canceled) return { ok: false, error: 'cancelled' };

  const uri = picked.assets[0].uri;
  let raw: string;
  try {
    raw = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
  } catch {
    return { ok: false, error: 'Could not read the selected file.' };
  }

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Invalid file format — not valid JSON.' };
  }

  if (!data || typeof data !== 'object') return { ok: false, error: 'Not a SpendVault backup file.' };
  if (typeof data.version !== 'string') return { ok: false, error: 'Not a SpendVault backup file.' };
  if (data.version !== BACKUP_VERSION) return { ok: false, error: `Backup version "${data.version}" is not supported.` };
  if (!Array.isArray(data.transactions) || !Array.isArray(data.categories)) {
    return { ok: false, error: 'Backup file is incomplete or corrupted.' };
  }

  return { ok: true, exportedAt: data.exportedAt ?? '', data: data as BackupData };
}

export function applyRestore(data: BackupData): void {
  db.delete(transactions).run();
  db.delete(budgets).run();
  db.delete(savingsGoals).run();
  db.delete(categories).run();
  db.delete(userProfile).run();
  db.delete(config).run();

  for (const row of data.categories)    db.insert(categories).values(row).onConflictDoNothing().run();
  for (const row of data.userProfile)   db.insert(userProfile).values(row).onConflictDoNothing().run();
  for (const row of data.transactions)  db.insert(transactions).values(row).onConflictDoNothing().run();
  for (const row of data.budgets)       db.insert(budgets).values(row).onConflictDoNothing().run();
  for (const row of data.savingsGoals)  db.insert(savingsGoals).values(row).onConflictDoNothing().run();
  for (const row of data.config)        db.insert(config).values(row).onConflictDoNothing().run();
}
