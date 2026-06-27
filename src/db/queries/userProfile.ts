import { db } from '@/db';
import { userProfile, type UserProfile, type InsertUserProfile } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { now } from '@/utils/date';

export function getProfile(): UserProfile | undefined {
  return db.select().from(userProfile).where(eq(userProfile.id, 1)).get();
}

export function createProfile(data: Omit<InsertUserProfile, 'id' | 'createdAt' | 'updatedAt'>): void {
  const timestamp = now();
  db.insert(userProfile)
    .values({ ...data, id: 1, createdAt: timestamp, updatedAt: timestamp })
    .onConflictDoUpdate({ target: userProfile.id, set: { ...data, updatedAt: timestamp } })
    .run();
}

export function updateProfile(data: Partial<Omit<InsertUserProfile, 'id' | 'createdAt'>>): void {
  db.update(userProfile)
    .set({ ...data, updatedAt: now() })
    .where(eq(userProfile.id, 1))
    .run();
}
