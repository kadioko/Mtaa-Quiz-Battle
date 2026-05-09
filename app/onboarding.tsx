/**
 * Onboarding — 4-slide first-time tutorial.
 * Covers: scoring, streaks/bonuses, daily challenge, hints/sprint/versus.
 * Uses Reanimated 3 for smooth slide transitions.
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { StorageService } from '../src/storage/storage';
import { useThemeColors } from '../src/utils/ThemeContext';
import { useLanguage } from '../src/utils/LanguageContext';
import { t } from '../src/utils/i18n';
import { Typography, Spacing, Radius } from '../src/theme';
import { HapticService } from '../src/utils/haptics';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🇹🇿',
    accentColor: '#2DD4BF',
    titleKey: 'onboardingSlide1Title' as const,
    bodyKey: 'onboardingSlide1Body' as const,
    details: [
      { icon: '⭐', key: 'Alama kwa kila jibu sahihi', keyEn: 'Points for every correct answer' },
      { icon: '🪙', key: 'Sarafu za ziada kwa mwendo wa haraka', keyEn: 'Bonus coins for fast answers' },
      { icon: '🏆', key: 'Panda ngazi kwa alama zaidi', keyEn: 'Level up with more points' },
    ],
  },
  {
    emoji: '🔥',
    accentColor: '#F97316',
    titleKey: 'onboardingSlide2Title' as const,
    bodyKey: 'onboardingSlide2Body' as const,
    details: [
      { icon: '⚡', key: 'Bonasi ya kasi: jibu chini ya 5 sek', keyEn: 'Speed bonus: answer under 5s' },
      { icon: '🔥', key: 'Bonasi ya mfululizo: maswali 3+ mfululizo', keyEn: 'Streak bonus: 3+ correct in a row' },
      { icon: '❄️', key: 'Nunua Barafu ya Mfululizo kulinda siku zilizokosekana', keyEn: 'Buy Streak Freeze to protect missed days' },
    ],
  },
  {
    emoji: '⚡',
    accentColor: '#A78BFA',
    titleKey: 'onboardingSlide3Title' as const,
    bodyKey: 'onboardingSlide3Body' as const,
    details: [
      { icon: '📅', key: 'Maswali mapya kila siku', keyEn: 'New questions every day' },
      { icon: '🎁', key: 'Zawadi ya kila siku ya sarafu', keyEn: 'Daily coin reward on login' },
      { icon: '🔗', key: 'Changamoto ya kila siku inabeba sarafu za ziada', keyEn: 'Daily challenge gives extra coins' },
    ],
  },
  {
    emoji: '💡',
    accentColor: '#FBBF24',
    titleKey: 'onboardingSlide4Title' as const,
    bodyKey: 'onboardingSlide4Body' as const,
    details: [
      { icon: '💡', key: 'Kidokezo: Ondoa majibu 2 (sarafu 15)', keyEn: 'Hint: Remove 2 wrong answers (15 coins)' },
      { icon: '🏃', key: 'Sprint: Maswali mengi katika sekunde 60', keyEn: 'Sprint: Most questions in 60 seconds' },
      { icon: '🥊', key: 'Versus: Pambana na rafiki yako', keyEn: 'Versus: Battle a friend on same device' },
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { language } = useLanguage();
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      scrollX.value = x;
      const idx = Math.round(x / width);
      setActiveSlide(idx);
    },
    [scrollX]
  );

  const goToSlide = (idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * width, animated: true });
    HapticService.selection(true);
  };

  const finish = async () => {
    await StorageService.markOnboardingDone();
    HapticService.levelUp(true);
    router.replace('/home');
  };

  const skip = async () => {
    await StorageService.markOnboardingDone();
    router.replace('/home');
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {/* Skip button */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }} />
          {activeSlide < SLIDES.length - 1 && (
            <TouchableOpacity onPress={skip} style={styles.skipBtn} activeOpacity={0.7}>
              <Text style={[styles.skipText, { color: colors.textMuted }]}>{t('onboardingSkip')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Slides */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scroller}
        >
          {SLIDES.map((slide, i) => (
            <SlideView
              key={i}
              slide={slide}
              index={i}
              scrollX={scrollX}
              colors={colors}
              language={language}
            />
          ))}
        </ScrollView>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <DotIndicator
              key={i}
              index={i}
              scrollX={scrollX}
              activeColor={SLIDES[activeSlide].accentColor}
              inactiveColor={colors.border}
              onPress={() => goToSlide(i)}
            />
          ))}
        </View>

        {/* Action button */}
        <View style={styles.btnRow}>
          {activeSlide < SLIDES.length - 1 ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: SLIDES[activeSlide].accentColor }]}
              onPress={() => goToSlide(activeSlide + 1)}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionBtnText, { color: '#000' }]}>
                {t('onboardingNext')} →
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: SLIDES[activeSlide].accentColor }]}
              onPress={finish}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionBtnText, { color: '#000' }]}>
                🎮 {t('onboardingDone')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SlideView({
  slide, index, scrollX, colors, language,
}: {
  slide: typeof SLIDES[0];
  index: number;
  scrollX: SharedValue<number>;
  colors: any;
  language: string;
}) {
  const animStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP);
    const translateY = interpolate(scrollX.value, inputRange, [24, 0, 24], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateY }] };
  });

  const titleKey = slide.titleKey;
  const bodyKey = slide.bodyKey;

  return (
    <View style={[styles.slide]}>
      <Animated.View style={[styles.slideContent, animStyle]}>
        <View style={[styles.emojiCircle, { backgroundColor: slide.accentColor + '22', borderColor: slide.accentColor + '55' }]}>
          <Text style={styles.slideEmoji}>{slide.emoji}</Text>
        </View>
        <Text style={[styles.slideTitle, { color: colors.text }]}>{t(titleKey)}</Text>
        <Text style={[styles.slideBody, { color: colors.textSecondary }]}>{t(bodyKey)}</Text>
        <View style={[styles.detailCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          {slide.details.map((d, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={styles.detailIcon}>{d.icon}</Text>
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {language === 'en' ? d.keyEn : d.key}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

function DotIndicator({
  index, scrollX, activeColor, inactiveColor, onPress,
}: {
  index: number;
  scrollX: SharedValue<number>;
  activeColor: string;
  inactiveColor: string;
  onPress: () => void;
}) {
  const animStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const w = interpolate(scrollX.value, inputRange, [8, 24, 8], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolation.CLAMP);
    return { width: withSpring(w), opacity };
  });

  return (
    <TouchableOpacity onPress={onPress} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
      <Animated.View style={[styles.dot, { backgroundColor: activeColor }, animStyle]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    alignItems: 'center',
    minHeight: 44,
  },
  skipBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 6 },
  skipText: { fontSize: Typography.fontSizes.sm },
  scroller: { flex: 1 },
  slide: { width, flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  slideContent: { width: '100%', alignItems: 'center', gap: Spacing.base },
  emojiCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  slideEmoji: { fontSize: 56 },
  slideTitle: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.extraBold,
    textAlign: 'center',
  },
  slideBody: {
    fontSize: Typography.fontSizes.md,
    textAlign: 'center',
    lineHeight: Typography.fontSizes.md * 1.6,
  },
  detailCard: {
    width: '100%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.base,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailIcon: { fontSize: 20, width: 28 },
  detailText: { flex: 1, fontSize: Typography.fontSizes.sm, lineHeight: Typography.fontSizes.sm * 1.5 },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.base,
  },
  dot: { height: 8, borderRadius: 4 },
  btnRow: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  actionBtn: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
  },
});
