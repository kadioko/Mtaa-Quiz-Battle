import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '../src/storage/storage';
import { UserProfile } from '../src/types';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { t } from '../src/utils/i18n';
import { useLanguage } from '../src/utils/LanguageContext';
import { isToday } from '../src/utils/gameLogic';
import PrimaryButton from '../src/components/PrimaryButton';
import { useThemeColors } from '../src/utils/ThemeContext';

const getMsUntilMidnight = (): number => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
};

const formatCountdown = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600).toString().padStart(2, '0');
  const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export default function DailyScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const colors = useThemeColors();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [countdown, setCountdown] = useState(getMsUntilMidnight());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refresh on focus so completing the daily immediately updates this screen
  useFocusEffect(
    useCallback(() => {
      StorageService.getUserProfile().then((p) => {
        setProfile(p);
        setAlreadyPlayed(isToday(p.lastDailyDate) && p.dailyCompleted);
      });
    }, [language])
  );

  useEffect(() => {
    if (!alreadyPlayed) return;
    timerRef.current = setInterval(() => {
      setCountdown(getMsUntilMidnight());
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [alreadyPlayed]);

  const handleStart = () => {
    router.push({ pathname: '/quiz', params: { categoryId: 'daily', isDaily: 'true' } });
  };

  const DAILY_CATEGORIES = ['🎵', '⚽', '🗺️', '📜', '🍛', '💬', '🏙️', '🦁', '💰', '🇹🇿'];

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.backgroundCardLight }]}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⚡ {t('dailyChallengeTitle')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <LinearGradient
            colors={[colors.secondary, colors.secondaryDark]}
            style={styles.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.heroEmoji}>{alreadyPlayed ? '✅' : '⚡'}</Text>
            <Text style={[styles.heroTitle, { color: '#000000' }]}>
              {alreadyPlayed ? t('dailyCompleted') : t('dailyChallengeTitle')}
            </Text>
            <Text style={[styles.heroSub, { color: 'rgba(0,0,0,0.78)' }]}>
              {alreadyPlayed ? t('dailyCompletedDesc') : t('dailyChallengeDesc')}
            </Text>
          </LinearGradient>

          {/* Daily streak */}
          <View style={[styles.streakCard, { backgroundColor: colors.backgroundCard, borderColor: colors.streak }]}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakLabel}>{t('dailyStreakLabel')}</Text>
              <Text style={styles.streakValue}>{profile?.dailyStreak ?? 0} {t('days')}</Text>
            </View>
            <View style={styles.streakDots}>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        // Show 1-7 lit dots; a full week stays fully lit instead of wrapping to 0
                        i < ((profile?.dailyStreak ?? 0) > 0 ? (((profile!.dailyStreak - 1) % 7) + 1) : 0)
                          ? colors.streak
                          : colors.border,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Category icons preview */}
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {language === 'sw' ? 'Makundi Yote' : 'All Categories'}
          </Text>
          <View style={styles.categoryGrid}>
            {DAILY_CATEGORIES.map((emoji, i) => (
              <View key={i} style={[styles.categoryChip, { backgroundColor: colors.backgroundCardLight }]}>
                <Text style={styles.categoryEmoji}>{emoji}</Text>
              </View>
            ))}
          </View>

          {/* Info cards */}
          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <Text style={[styles.infoValue, { color: colors.primary }]}>10</Text>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                {language === 'sw' ? 'Maswali' : 'Questions'}
              </Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <Text style={[styles.infoValue, { color: colors.primary }]}>15s</Text>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                {language === 'sw' ? 'Kwa Kila Swali' : 'Per Question'}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoValue}>🪙</Text>
              <Text style={styles.infoLabel}>
                {language === 'sw' ? 'Sarafu Zaidi' : 'Bonus Coins'}
              </Text>
            </View>
          </View>

          {/* Action */}
          {alreadyPlayed ? (
            <View style={styles.completedBox}>
              <Text style={styles.completedText}>
                {language === 'sw' ? 'Changamoto mpya inakuja!' : 'Next challenge in:'}
              </Text>
              <Text style={styles.countdownText}>{formatCountdown(countdown)}</Text>
              <PrimaryButton
                label={language === 'sw' ? 'Cheza Mchezo Mwingine' : 'Play Another Game'}
                onPress={() => router.push('/categories')}
                color={colors.backgroundCardLight}
                textColor={colors.text}
                style={{ marginTop: Spacing.base }}
              />
            </View>
          ) : (
            <PrimaryButton
              label={t('startChallenge')}
              onPress={handleStart}
              color={colors.secondary}
              textColor={colors.white}
              style={styles.startBtn}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCardLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: { fontSize: 28, color: Colors.text, lineHeight: 32 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text,
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  hero: {
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  heroEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  heroTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.extraBold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  heroSub: {
    fontSize: Typography.fontSizes.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  streakCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.streak,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  streakEmoji: { fontSize: 32 },
  streakInfo: { flex: 1 },
  streakLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  streakValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.streak,
  },
  streakDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  categoryChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundCardLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryEmoji: { fontSize: 22 },
  infoGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
  },
  infoValue: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.black,
    color: Colors.primary,
  },
  infoLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  startBtn: { marginTop: Spacing.sm },
  completedBox: {
    backgroundColor: Colors.secondary + '22',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.secondary,
    padding: Spacing.base,
    alignItems: 'center',
  },
  completedText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.secondary,
    textAlign: 'center',
    fontWeight: Typography.fontWeights.medium,
  },
  countdownText: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.black,
    color: Colors.primary,
    letterSpacing: 2,
    marginTop: Spacing.sm,
    fontVariant: ['tabular-nums'],
  },
});
