import React, { useState, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '../src/storage/storage';
import { CloudService } from '../src/services/CloudService';
import { CloudEvent } from '../src/types';
import { getWeekKey } from '../src/data/questions';
import { DailyMission, DailyMissionId, DailyMissionState, UserProfile } from '../src/types';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { t } from '../src/utils/i18n';
import { useLanguage } from '../src/utils/LanguageContext';
import { useThemeColors } from '../src/utils/ThemeContext';
import { isToday, isYesterday } from '../src/utils/gameLogic';
import { getTrainingRecommendation, TrainingRecommendation } from '../src/utils/recommendations';
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

const getMissionCopy = (mission: DailyMission, language: 'sw' | 'en') => {
  const sw = language === 'sw';
  if (mission.id === 'rounds') {
    return {
      emoji: '🎮',
      title: sw ? 'Cheza raundi 2' : 'Play 2 rounds',
      color: Colors.primary,
    };
  }
  if (mission.id === 'correct_answers') {
    return {
      emoji: '🎯',
      title: sw ? 'Pata majibu 12 sahihi' : 'Get 12 correct answers',
      color: Colors.secondary,
    };
  }
  return {
    emoji: '🔥',
    title: sw ? 'Fikia mfululizo wa 5' : 'Reach a 5-answer streak',
    color: Colors.gold,
  };
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
  const [mistakeCount, setMistakeCount] = useState(0);
  const [weeklyDone, setWeeklyDone] = useState(false);
  const [liveEvent, setLiveEvent] = useState<CloudEvent | null>(null);
  const [eventDone, setEventDone] = useState(false);
  const [focus, setFocus] = useState<TrainingRecommendation | null>(null);
  const [missions, setMissions] = useState<DailyMissionState | null>(null);
  const [claimingMission, setClaimingMission] = useState<DailyMissionId | null>(null);

  const loadProfile = useCallback(async () => {
    const p = await StorageService.getUserProfile();

    const history = await StorageService.getQuizHistory();
    const recommendation = getTrainingRecommendation(
      history,
      Math.floor(Date.now() / 86_400_000)
    );
    setMistakeCount(recommendation.mistakeCount);
    setFocus(recommendation);
    setMissions(await StorageService.getDailyMissions());

    const weekly = await StorageService.getWeeklyStatus();
    setWeeklyDone(weekly.completed && weekly.weekKey === getWeekKey());

    // Live event check (best-effort, silent offline)
    if (CloudService.isAvailable()) {
      CloudService.fetchActiveEvent()
        .then(async (event) => {
          setLiveEvent(event);
          if (event) {
            const done = await StorageService.getCompletedEventIds();
            setEventDone(done.includes(event.id));
          }
        })
        .catch(() => {});
    }

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

  // Refresh coins, streaks, and the practice banner every time Home regains focus
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const navItems = [
    { icon: '🎯', label: t('playNow'), route: '/categories', color: Colors.primary },
    { icon: '⚡', label: t('dailyChallenge'), route: '/daily', color: Colors.secondary },
    { icon: '🏆', label: t('leaderboard'), route: '/leaderboard', color: Colors.gold },
    { icon: '👤', label: t('profile'), route: '/profile', color: Colors.accent },
  ];

  const focusColor = focus?.category?.color ?? colors.accent;
  const focusTitle = (() => {
    if (!focus) return '';
    if (focus.reason === 'practice') {
      return language === 'sw' ? 'Rudia makosa yako' : 'Practice your mistakes';
    }
    const categoryName = language === 'en'
      ? focus.category?.name_en
      : focus.category?.name;
    if (focus.reason === 'weakest') {
      return language === 'sw'
        ? `Imarisha ${categoryName}`
        : `Strengthen ${categoryName}`;
    }
    if (focus.reason === 'keep-playing') {
      return language === 'sw'
        ? `Endelea na ${categoryName}`
        : `Keep your edge in ${categoryName}`;
    }
    return language === 'sw'
      ? `Gundua ${categoryName}`
      : `Explore ${categoryName}`;
  })();

  const focusSubtitle = (() => {
    if (!focus) return '';
    if (focus.reason === 'practice') {
      return language === 'sw'
        ? `Maswali ${focus.mistakeCount} bado yanahitaji mazoezi`
        : `${focus.mistakeCount} questions are ready for another go`;
    }
    if (focus.reason === 'weakest') {
      return language === 'sw'
        ? `Usahihi wako ni ${focus.accuracy}% - raundi moja inaweza kubadilisha hilo`
        : `You are at ${focus.accuracy}% - one round can move that up`;
    }
    if (focus.reason === 'keep-playing') {
      return language === 'sw'
        ? `${focus.accuracy}% usahihi - piga rekodi yako`
        : `${focus.accuracy}% accuracy - go for a new best`;
    }
    return language === 'sw'
      ? 'Jaribu kundi jipya leo'
      : 'Try a fresh category today';
  })();

  const startFocus = () => {
    if (!focus) return;
    if (focus.reason === 'practice') {
      router.push({ pathname: '/quiz', params: { mode: 'practice' } });
      return;
    }
    if (focus.category) {
      router.push({ pathname: '/quiz', params: { categoryId: focus.category.id } });
    }
  };

  const claimMission = async (mission: DailyMission) => {
    setClaimingMission(mission.id);
    try {
      const claimed = await StorageService.claimDailyMission(mission.id);
      if (!claimed.success) return;
      setMissions(claimed.missions);
      setProfile(claimed.profile);
      Alert.alert(
        language === 'sw' ? 'Hongera!' : 'Nice work!',
        language === 'sw'
          ? `Umepata sarafu ${claimed.reward}.`
          : `You earned ${claimed.reward} coins.`
      );
    } finally {
      setClaimingMission(null);
    }
  };

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

          {focus && (
            <TouchableOpacity
              style={[styles.focusCard, { backgroundColor: colors.backgroundCard, borderColor: focusColor }]}
              onPress={startFocus}
              activeOpacity={0.84}
              accessibilityRole="button"
              accessibilityLabel={focusTitle}
            >
              <View style={[styles.focusIcon, { backgroundColor: focusColor + '22' }]}>
                <Text style={styles.focusEmoji}>{focus.reason === 'practice' ? '↻' : focus.category?.emoji}</Text>
              </View>
              <View style={styles.focusContent}>
                <Text style={[styles.focusEyebrow, { color: focusColor }]}>
                  {language === 'sw' ? 'LENGO LAKO' : 'YOUR FOCUS'}
                </Text>
                <Text style={[styles.focusTitle, { color: colors.text }]}>{focusTitle}</Text>
                <Text style={[styles.focusSub, { color: colors.textMuted }]}>{focusSubtitle}</Text>
              </View>
              <Text style={[styles.focusArrow, { color: focusColor }]}>›</Text>
            </TouchableOpacity>
          )}

          {missions && (
            <View style={[styles.missionsCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <View style={styles.missionsHeader}>
                <View>
                  <Text style={[styles.missionsTitle, { color: colors.text }]}>
                    {language === 'sw' ? 'Misheni za Leo' : "Today's Missions"}
                  </Text>
                  <Text style={[styles.missionsSub, { color: colors.textMuted }]}>
                    {language === 'sw' ? 'Kamilisha, chukua sarafu' : 'Complete them, collect coins'}
                  </Text>
                </View>
                <Text style={styles.missionsEmoji}>🏅</Text>
              </View>
              {missions.missions.map((mission) => {
                const copy = getMissionCopy(mission, language);
                const complete = mission.progress >= mission.target;
                const progress = Math.min(mission.progress / mission.target, 1);
                return (
                  <View key={mission.id} style={styles.missionRow}>
                    <Text style={styles.missionEmoji}>{copy.emoji}</Text>
                    <View style={styles.missionContent}>
                      <View style={styles.missionTextRow}>
                        <Text style={[styles.missionTitle, { color: colors.text }]}>{copy.title}</Text>
                        <Text style={[styles.missionReward, { color: colors.gold }]}>+{mission.reward} 🪙</Text>
                      </View>
                      <View style={[styles.missionTrack, { backgroundColor: colors.backgroundCardLight }]}>
                        <View style={[styles.missionFill, { width: `${progress * 100}%`, backgroundColor: copy.color }]} />
                      </View>
                      <View style={styles.missionFooter}>
                        <Text style={[styles.missionProgress, { color: colors.textMuted }]}>
                          {Math.min(mission.progress, mission.target)}/{mission.target}
                        </Text>
                        {mission.claimed ? (
                          <Text style={[styles.missionClaimed, { color: colors.secondary }]}>
                            {language === 'sw' ? 'IMECHUKULIWA' : 'CLAIMED'}
                          </Text>
                        ) : complete ? (
                          <TouchableOpacity
                            onPress={() => claimMission(mission)}
                            disabled={claimingMission === mission.id}
                            style={[styles.claimButton, { backgroundColor: copy.color }]}
                            accessibilityRole="button"
                            accessibilityLabel={language === 'sw' ? `Chukua sarafu ${mission.reward}` : `Claim ${mission.reward} coins`}
                          >
                            <Text style={styles.claimButtonText}>
                              {claimingMission === mission.id
                                ? '...'
                                : language === 'sw' ? 'CHUKUA' : 'CLAIM'}
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Nav grid */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('mainMenu')}</Text>
          <View style={styles.navGrid}>
            {navItems.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={[styles.navCard, { backgroundColor: colors.backgroundCard, borderColor: item.color }]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={item.label}
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
              style={[styles.modeCard, { backgroundColor: colors.backgroundCard, borderColor: colors.secondary }]}
              onPress={() => router.push('/challenge')}
              activeOpacity={0.8}
            >
              <Text style={styles.modeEmoji}>🏁</Text>
              <Text style={[styles.modeLabel, { color: colors.secondary }]}>
                {language === 'sw' ? 'Changamoto' : 'Challenge'}
              </Text>
              <Text style={[styles.modeSub, { color: colors.textMuted }]}>
                {language === 'sw' ? 'Simu tofauti' : 'Cross-device'}
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

          {/* LIVE event banner */}
          {liveEvent && (
            <TouchableOpacity
              style={styles.dailyBanner}
              onPress={() =>
                router.push({
                  pathname: '/quiz',
                  params: {
                    mode: 'event',
                    eventId: liveEvent.id,
                    eventSeed: liveEvent.seed,
                    eventName: liveEvent.name,
                    eventNameEn: liveEvent.name_en,
                  },
                })
              }
              activeOpacity={0.85}
              disabled={eventDone}
            >
              <LinearGradient
                colors={eventDone ? [colors.backgroundCard, colors.backgroundCardLight] : ['#FF1744', '#D500F9']}
                style={styles.dailyGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.dailyLeft}>
                  <Text style={styles.dailyIcon}>{eventDone ? '✅' : liveEvent.emoji}</Text>
                  <View>
                    <Text style={[styles.dailyTitle, eventDone && { color: colors.textSecondary }]}>
                      {!eventDone && '🔴 LIVE · '}{language === 'en' ? liveEvent.name_en : liveEvent.name}
                    </Text>
                    <Text style={[styles.dailySub, eventDone && { color: colors.textMuted }]}>
                      {eventDone
                        ? (language === 'sw' ? 'Umeshashiriki — angalia ubao wa wachezaji!' : 'Already played — check the leaderboard!')
                        : (language === 'sw' ? 'Tukio maalum linaendelea sasa hivi!' : 'Special event happening right now!')}
                    </Text>
                  </View>
                </View>
                {!eventDone && <Text style={styles.dailyArrow}>›</Text>}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Weekly challenge banner */}
          <TouchableOpacity
            style={[styles.practiceBanner, { backgroundColor: colors.backgroundCard, borderColor: weeklyDone ? colors.border : '#E040FB' }]}
            onPress={() => router.push({ pathname: '/quiz', params: { mode: 'weekly' } })}
            activeOpacity={0.85}
            disabled={weeklyDone}
          >
            <View style={styles.dailyLeft}>
              <Text style={styles.dailyIcon}>{weeklyDone ? '✅' : '🗓️'}</Text>
              <View>
                <Text style={[styles.practiceTitle, { color: colors.text }]}>
                  {language === 'sw' ? 'Changamoto ya Wiki' : 'Weekly Challenge'}
                </Text>
                <Text style={[styles.practiceSub, { color: colors.textMuted }]}>
                  {weeklyDone
                    ? (language === 'sw' ? 'Imekamilika — rudi wiki ijayo!' : 'Done — come back next week!')
                    : (language === 'sw' ? 'Maswali magumu 10, mara moja kwa wiki' : '10 tougher questions, once a week')}
                </Text>
              </View>
            </View>
            {!weeklyDone && <Text style={[styles.dailyArrow, { color: '#E040FB' }]}>›</Text>}
          </TouchableOpacity>

          {/* Practice mistakes banner */}
          {mistakeCount > 0 && (
            <TouchableOpacity
              style={[styles.practiceBanner, { backgroundColor: colors.backgroundCard, borderColor: colors.accent }]}
              onPress={() => router.push({ pathname: '/quiz', params: { mode: 'practice' } })}
              activeOpacity={0.85}
            >
              <View style={styles.dailyLeft}>
                <Text style={styles.dailyIcon}>🔁</Text>
                <View>
                  <Text style={[styles.practiceTitle, { color: colors.text }]}>{t('practiceMistakes')}</Text>
                  <Text style={[styles.practiceSub, { color: colors.textMuted }]}>
                    {t('practiceMistakesDesc')} · {mistakeCount}
                  </Text>
                </View>
              </View>
              <Text style={[styles.dailyArrow, { color: colors.accent }]}>›</Text>
            </TouchableOpacity>
          )}
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
  focusCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  focusIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusEmoji: { fontSize: 25 },
  focusContent: { flex: 1 },
  focusEyebrow: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 0.5,
  },
  focusTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.extraBold,
    marginTop: 2,
  },
  focusSub: {
    fontSize: Typography.fontSizes.sm,
    lineHeight: Typography.fontSizes.sm * 1.35,
    marginTop: 2,
  },
  focusArrow: {
    fontSize: 32,
    fontWeight: Typography.fontWeights.bold,
  },
  missionsCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  missionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  missionsTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.extraBold,
  },
  missionsSub: {
    fontSize: Typography.fontSizes.sm,
    marginTop: 2,
  },
  missionsEmoji: { fontSize: 28 },
  missionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  missionEmoji: { fontSize: 21, marginTop: 1 },
  missionContent: { flex: 1 },
  missionTextRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  missionTitle: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semiBold,
  },
  missionReward: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
  },
  missionTrack: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: 6,
  },
  missionFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  missionFooter: {
    minHeight: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  missionProgress: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
  },
  missionClaimed: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 0.4,
  },
  claimButton: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  claimButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 0.4,
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
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  modeCard: {
    flexGrow: 1,
    flexBasis: '46%',
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
  practiceBanner: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.base,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  practiceTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
  },
  practiceSub: {
    fontSize: Typography.fontSizes.sm,
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
