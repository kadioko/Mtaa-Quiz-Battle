import React, { useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { LanguageProvider } from '../src/utils/LanguageContext';
import { ThemeProvider, useTheme } from '../src/utils/ThemeContext';
import { NotificationService } from '../src/services/NotificationService';
import { SoundService } from '../src/services/SoundService';
import { QuestionSyncService } from '../src/services/QuestionSyncService';
import { IAPService } from '../src/services/IAPService';
import { CloudService } from '../src/services/CloudService';
import { StorageService } from '../src/storage/storage';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();

    // Preload sound effects so answers play with zero latency
    SoundService.preload().catch(() => {});

    // Remote questions: cached first, then background refresh
    QuestionSyncService.initialize().catch(() => {});

    // Register service worker for offline PWA (web only)
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Connect IAP service (native only)
    if (Platform.OS !== 'web') {
      IAPService.connect().catch(() => {});
      // Register Expo Push Token with cloud (best-effort, silent on failure)
      NotificationService.registerWithCloud().catch(() => {});
    }

    // Handle magic-link deep-link: mtaaquiz://auth?token=xxx&type=magiclink
    const handleUrl = async (url: string) => {
      try {
        const parsed = new URL(url);
        const token = parsed.searchParams.get('token');
        const type = parsed.searchParams.get('type') as 'magiclink' | 'recovery' | null;
        if (token && (type === 'magiclink' || type === 'recovery')) {
          await CloudService.exchangeToken(token, type);
        }
      } catch {}
    };
    const sub = Linking.addEventListener('url', ({ url }) => { handleUrl(url); });
    Linking.getInitialURL().then((url) => { if (url) handleUrl(url); });

    return () => {
      sub.remove();
      if (Platform.OS !== 'web') {
        IAPService.disconnect().catch(() => {});
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <RootStack />
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootStack() {
  const { themeMode } = useTheme();
  const router = useRouter();

  useEffect(() => {
    // Navigate to the correct screen when a notification is tapped
    const subscription = NotificationService.addResponseListener((screen) => {
      if (screen === 'daily') router.push('/daily');
    });
    // Cold start: app launched by tapping a notification
    if (Platform.OS !== 'web') {
      NotificationService.getInitialNotificationScreen()
        .then((screen) => {
          if (screen === 'daily') router.push('/daily');
        })
        .catch(() => {});
    }
    return () => subscription.remove();
  }, [router]);

  return (
    <>
      <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="quiz" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="result" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="daily" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="sprint" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="versus" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="challenge" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="shop" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="signin" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
