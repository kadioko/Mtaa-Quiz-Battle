import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '../src/storage/storage';
import { UserProfile, DailyReward } from '../src/types';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { t } from '../src/utils/i18n';
import { useLanguage } from '../src/utils/LanguageContext';
import { useThemeColors } from '../src/utils/ThemeContext';
import { isToday, isYesterday } from '../src/utils/gameLogic';
import PrimaryButton from '../src/components/PrimaryButton';

const { width } = Dimensions.get('window');

const getGreeting = (lang: 'sw' | 'en'): string => {
  const h = new Date().getHours();
  if (lang === 'sw') {
    if (h < 12) return 'Habari za asubuhi';
    if (h < 17) return 'Habari za mchana';
    return 'Habari za jioni';
  }
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function HomeScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const colors = useThemeColors();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyDone, setDailyDone] = useState(false);
  const [rewardModal, setRewardModal] = useState(false);
  const [todayCoins, setTodayCoins] = useState(0);
  const [rewardStreak, setRewardStreak] = useState(1);
  const [streakReset, setStreakReset] = useState(false);

  const loadProfile = useCallback(async () => {
    const p = await StorageService.getUserProfile();
    let nextProfile = p;
    setDailyDone(p.dailyCompleted && p.lastDailyDate === new Date().toDateString());

    const reward = await StorageService.getDailyReward();
    const today = new Date().toDateString();
    if (reward.lastClaimedDate !== today) {
      const wasYesterday = isYesterday(reward.lastClaimedDate);
      const newDays = wasYesterday ? reward.consecutiveDays + 1 : 1;
      const coins = Math.min(10 + newDays * 5, 50);
      setTodayCoins(coins);
      setRewardStreak(newDays);
      setStreakReset(!wasYesterday && reward.consecutiveDays > 0);
      setRewardModal(true);
      await StorageService.saveDailyReward({
        lastClaimedDate: today,
        consecutiveDays: newDays,
        totalClaimed: reward.totalClaimed + coins,
      });
      nextProfile = { ...p, totalCoins: p.totalCoins + coins };
      await StorageService.saveUserProfile(nextProfile);
    }
    setProfile(nextProfile);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const navItems = [
    { icon: '🎯', label: t('playNow'), route: '/categories', color: Colors.primary },
    { icon: '⚡', label: t('dailyChallenge'), route: '/daily', color: Colors.secondary },
    { icon: '🏆', label: t('leaderboard'), route: '/leaderboard', color: Colors.gold },
    { icon: '👤', label: t('profile'), route: '/profile', color: Colors.accent },
  ];

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting(language)} 👋</Text>
              <Text style={[styles.appName, { color: colors.text }]}>
                {profile?.username ?? 'Mchezaji'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.settingsBtn, { backgroundColor: colors.backgroundCardLight }]}
              onPress={() => router.push('/settings')}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={[styles.statChip, { backgroundColor: colors.backgroundCard, borderColor: colors.gold }]}>
              <Text style={styles.statEmoji}>🪙</Text>
              <Text style={[styles.statValue, { color: Colors.gold }]}>
                {profile?.totalCoins ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('coins')}</Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: colors.backgroundCard, borderColor: colors.streak }]}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={[styles.statValue, { color: Colors.streak }]}>
                {profile?.dailyStreak ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('dailyStreakLabel')}</Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: colors.backgroundCard, borderColor: colors.secondary }]}>
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={[styles.statValue, { color: Colors.secondary }]}>
                {profile?.bestScore ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('bestScore')}</Text>
            </View>
          </View>

          {/* Hero banner */}
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.heroBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View>
              <Text style={styles.heroTitle}>{t('readyToPlay')} 🎮</Text>
              <Text style={styles.heroSub}>
                {profile?.totalGamesPlayed
                  ? t('gamesPlayed', { count: profile.totalGamesPlayed })
                  : t('firstGamePrompt')}
              </Text>
            </View>
            <PrimaryButton
              label={t('playNow')}
              onPress={() => router.push('/categories')}
              color={colors.backgroundCard}
              textColor={colors.primary}
              size="md"
            />
          </LinearGradient>

          {/* Nav grid */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('mainMenu')}</Text>
          <View style={styles.navGrid}>
            {navItems.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={[styles.navCard, { backgroundColor: colors.backgroundCard, borderColor: item.color }]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.navIcon}>{item.icon}</Text>
                <Text style={[styles.navLabel, { color: item.color }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* New modes row */}
          <View style={styles.modesRow}>
            <TouchableOpacity
              style={[styles.modeCard, { backgroundColor: colors.backgroundCard, borderColor: colors.primary }]}
              onPress={() => router.push('/sprint')}
              activeOpacity={0.8}
            >
              <Text style={styles.modeEmoji}>🏃</Text>
              <Text style={[styles.modeLabel, { color: colors.primary }]}>
                {language === 'sw' ? 'Sprint' : 'Sprint'}
              </Text>
              <Text style={[styles.modeSub, { color: colors.textMuted }]}>
                {language === 'sw' ? '60 sek' : '60s'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeCard, { backgroundColor: colors.backgroundCard, borderColor: colors.accent }]}
              onPress={() => router.push('/versus')}
              activeOpacity={0.8}
            >
              <Text style={styles.modeEmoji}>🥊</Text>
              <Text style={[styles.modeLabel, { color: colors.accent }]}>
                {language === 'sw' ? 'Versus' : 'Versus'}
              </Text>
              <Text style={[styles.modeSub, { color: colors.textMuted }]}>
                {language === 'sw' ? 'Watu 2' : '2 players'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeCard, { backgroundColor: colors.backgroundCard, borderColor: colors.gold }]}
              onPress={() => router.push('/shop')}
              activeOpacity={0.8}
            >
              <Text style={styles.modeEmoji}>🛒</Text>
              <Text style={[styles.modeLabel, { color: colors.gold }]}>
                {language === 'sw' ? 'Duka' : 'Shop'}
              </Text>
              <Text style={[styles.modeSub, { color: colors.textMuted }]}>
                {language === 'sw' ? 'Nunua' : 'Buy'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Daily challenge teaser */}
          <TouchableOpacity
            style={styles.dailyBanner}
            onPress={() => router.push('/daily')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={dailyDone ? [colors.backgroundCard, colors.backgroundCardLight] : [colors.secondary, colors.secondaryDark]}
              style={styles.dailyGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.dailyLeft}>
                <Text style={styles.dailyIcon}>{dailyDone ? '✅' : '⚡'}</Text>
                <View>
                  <Text style={[styles.dailyTitle, dailyDone && { color: colors.textSecondary }]}>
                    {t('dailyChallenge')}
                  </Text>
                  <Text style={[styles.dailySub, dailyDone && { color: colors.textMuted }]}>
                    {dailyDone
                      ? t('alreadyPlayedToday')
                      : t('dailyChallengeDesc')}
                  </Text>
                </View>
              </View>
              {dailyDone ? (
                <View style={styles.doneBadge}>
                  <Text style={styles.doneBadgeText}>{language === 'sw' ? 'IMEKAMILIKA' : 'DONE'}</Text>
                </View>
              ) : (
                <Text style={styles.dailyArrow}>›</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Daily reward modal */}
      <Modal visible={rewardModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.backgroundCard, borderColor: colors.primary }]}>
            <Text style={styles.modalEmoji}>🎁</Text>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('dailyReward')}</Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>{t('welcomeBack')}</Text>
            <View style={styles.streakRow}>
              <Text style={styles.streakDayText}>🔥 {language === 'sw' ? `Siku ya ${rewardStreak}` : `Day ${rewardStreak}`}</Text>
              {streakReset && (
                <Text style={styles.streakResetText}>
                  {language === 'sw' ? '(Mfululizo ulianza upya)' : '(Streak restarted)'}
                </Text>
              )}
            </View>
            <View style={[styles.coinsBadge, { backgroundColor: colors.backgroundCardLight }]}>
              <Text style={styles.coinsText}>+{todayCoins} 🪙</Text>
            </View>
            <PrimaryButton
              label={t('claimReward')}
              onPress={() => setRewardModal(false)}
              color={colors.primary}
              textColor={colors.black}
              style={{ marginTop: Spacing.base, width: '100%' }}
            />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxxl },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
  },
  appName: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.black,
    color: Colors.text,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCardLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: { fontSize: 20 },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statChip: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  statEmoji: { fontSize: 18 },
  statValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.extraBold,
  },
  statLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },

  heroBanner: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.black,
  },
  heroSub: {
    fontSize: Typography.fontSizes.sm,
    color: 'rgba(0,0,0,0.7)',
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  navCard: {
    width: (width - Spacing.base * 2 - Spacing.sm) / 2,
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  navIcon: { fontSize: 32 },
  navLabel: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    textAlign: 'center',
  },

  modesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  modeCard: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.base,
    alignItems: 'center',
    gap: 4,
  },
  modeEmoji: { fontSize: 26 },
  modeLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    textAlign: 'center',
  },
  modeSub: {
    fontSize: Typography.fontSizes.xs,
    textAlign: 'center',
  },

  dailyBanner: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.base,
  },
  dailyGradient: {
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dailyLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dailyIcon: { fontSize: 28 },
  dailyTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.white,
  },
  dailySub: {
    fontSize: Typography.fontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  dailyArrow: {
    fontSize: 32,
    color: Colors.white,
    fontWeight: Typography.fontWeights.bold,
  },
  doneBadge: {
    backgroundColor: Colors.secondary + '33',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  doneBadgeText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.secondary,
    letterSpacing: 0.5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  modalEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  modalTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.extraBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  modalSub: {
    fontSize: Typography.fontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
  },
  coinsBadge: {
    backgroundColor: Colors.backgroundCardLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  coinsText: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.black,
    color: Colors.gold,
  },
  streakRow: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  streakDayText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.streak,
  },
  streakResetText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
