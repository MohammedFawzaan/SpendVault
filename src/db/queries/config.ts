import { db } from '@/db';
import { config } from '@/db/schema';
import { eq } from 'drizzle-orm';

export function getConfig(key: string): string | null {
  const row = db.select().from(config).where(eq(config.key, key)).get();
  return row?.value ?? null;
}

export function setConfig(key: string, value: string): void {
  db.insert(config)
    .values({ key, value })
    .onConflictDoUpdate({ target: config.key, set: { value } })
    .run();
}

export function isOnboardingComplete(): boolean {
  return getConfig('onboarding_complete') === 'true';
}

export function setOnboardingComplete(): void {
  setConfig('onboarding_complete', 'true');
}

export function isSmsPermissionGranted(): boolean {
  return getConfig('sms_permission_granted') === 'true';
}

export function setSmsPermissionGranted(granted: boolean): void {
  setConfig('sms_permission_granted', granted ? 'true' : 'false');
}

export function getLastBackupAt(): string | null {
  const val = getConfig('last_backup_at');
  return val && val.length > 0 ? val : null;
}

export function setLastBackupAt(isoDate: string): void {
  setConfig('last_backup_at', isoDate);
}

export function getAppVersion(): string {
  return getConfig('app_version') ?? '1.0';
}
