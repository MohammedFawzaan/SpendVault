import { AuthProvider, useAuth } from '@/context/AuthContext';
import { initializeDatabase } from '@/db';
import { isOnboardingComplete } from '@/db/queries/config';
import { seedDatabase } from '@/db/seed';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as Font from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { requestNotificationPermission } from '@/services/notifications';
import { startSmsListener } from '@/services/smsListener';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inTabs = segments[0] === '(tabs)';
    const done = isOnboardingComplete();

    if (done && !isAuthenticated && inTabs) {
      router.replace('/lock');
    }
  }, [isAuthenticated, segments]);

  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          Poppins_400Regular,
          Poppins_500Medium,
          Poppins_600SemiBold,
          Poppins_700Bold,
        });
        initializeDatabase();
        seedDatabase();
        await requestNotificationPermission();
      } catch (e) {
        console.error('App init failed:', e);
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();

    const removeSmsListener = startSmsListener();
    return () => removeSmsListener();
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="dark" />
        <AuthGate />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
