import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { LanguageProvider } from '../src/utils/LanguageContext';
import { ThemeProvider, useTheme } from '../src/utils/ThemeContext';
import { NotificationService } from '../src/services/NotificationService';
import { IAPService } from '../src/services/IAPService';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();

    // Register service worker for offline PWA (web only)
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Connect IAP service (native only)
    if (Platform.OS !== 'web') {
      IAPService.connect().catch(() => {});
    }

    return () => {
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
        <Stack.Screen name="shop" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
