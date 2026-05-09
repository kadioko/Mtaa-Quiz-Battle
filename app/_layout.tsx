import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { LanguageProvider } from '../src/utils/LanguageContext';
import { ThemeProvider, useTheme } from '../src/utils/ThemeContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
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
      </Stack>
    </>
  );
}
