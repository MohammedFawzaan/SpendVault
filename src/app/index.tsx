import { Redirect } from 'expo-router';
import { isOnboardingComplete } from '@/db/queries/config';

export default function Index() {
  const done = isOnboardingComplete();
  if (!done) return <Redirect href="/onboarding/splash" />;
  return <Redirect href="/lock" />;
}
