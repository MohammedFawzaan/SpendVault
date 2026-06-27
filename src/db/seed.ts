import { openDatabaseSync } from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { now } from '@/utils/date';

const expo = openDatabaseSync('spendvault.db');

// Seeds default categories and initial config values.
// Safe to call multiple times — INSERT OR IGNORE keeps existing data.
export function seedDatabase(): void {
  const timestamp = now();

  for (const cat of DEFAULT_CATEGORIES) {
    expo.runSync(
      `INSERT OR IGNORE INTO categories (name, icon, color, type, is_default, created_at)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [cat.name, cat.icon, cat.color, cat.type, timestamp]
    );
  }

  const configDefaults: [string, string][] = [
    ['app_version',            '1.0'],
    ['currency',               '₹'],
    ['onboarding_complete',    'false'],
    ['sms_permission_granted', 'false'],
    ['last_backup_at',         ''],
    ['auth_method',            ''],
    ['pin',                    ''],
  ];

  for (const [key, value] of configDefaults) {
    expo.runSync(
      `INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)`,
      [key, value]
    );
  }
}
