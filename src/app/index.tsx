import { Redirect } from 'expo-router';
import { isOnboardingComplete } from '@/db/queries/config';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const done = isOnboardingComplete();
  const { isAuthenticated } = useAuth();

  if (!done) return <Redirect href="/onboarding/splash" />;
  if (!isAuthenticated) return <Redirect href="/lock" />;
  return <Redirect href="/(tabs)" />;
}

