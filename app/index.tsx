import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkColors, LightColors, Typography, Spacing } from '../src/theme';
import { StorageService } from '../src/storage/storage';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dot0 = useRef(new Animated.Value(0.3)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const [tagline, setTagline] = useState('Jaribu Ujuzi Wako wa Bongo!');
  const [colors, setColors] = useState(DarkColors);

  useEffect(() => {
    StorageService.getSettings().then((s) => {
      setTagline(s.language === 'en' ? 'Test Your Tanzania Knowledge!' : 'Jaribu Ujuzi Wako wa Bongo!');
      setColors(s.themeMode === 'light' ? LightColors : DarkColors);
    });
  }, []);

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ])
      );
    Animated.parallel([
      pulse(dot0, 0),
      pulse(dot1, 200),
      pulse(dot2, 400),
    ]).start();
  }, [dot0, dot1, dot2]);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(async () => {
      const seen = await StorageService.hasSeenOnboarding();
      router.replace(seen ? '/home' : '/onboarding');
    }, 2600);

    return () => clearTimeout(timer);
  }, [router, logoScale, logoOpacity, taglineOpacity]);

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd, colors.gradientStart]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            { transform: [{ scale: logoScale }], opacity: logoOpacity },
          ]}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🇹🇿</Text>
          </View>
          <Text style={styles.title}>Mtaa Quiz</Text>
          <Text style={styles.titleAccent}>Battle</Text>
        </Animated.View>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          {tagline}
        </Animated.Text>
      </View>

      <View style={styles.dotsRow}>
        {([dot0, dot1, dot2] as Animated.Value[]).map((anim, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: colors.primary, opacity: anim },
            ]}
          />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: DarkColors.backgroundCardLight,
    borderWidth: 3,
    borderColor: DarkColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
    boxShadow: `0px 0px 20px ${DarkColors.primary}99`,
  },
  logoEmoji: {
    fontSize: 52,
  },
  title: {
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: Typography.fontWeights.extraBold,
    color: DarkColors.text,
    letterSpacing: 0,
  },
  titleAccent: {
    fontSize: Typography.fontSizes.display,
    fontWeight: Typography.fontWeights.black,
    color: DarkColors.primary,
    letterSpacing: 0,
    marginTop: -8,
  },
  tagline: {
    fontSize: Typography.fontSizes.base,
    color: DarkColors.textSecondary,
    letterSpacing: 0.5,
    marginTop: Spacing.base,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: Spacing.xxxl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
