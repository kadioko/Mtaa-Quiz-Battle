import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { DailyMission, DailyMissionId, DailyMissionState, QuizResult } from '../src/types';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { t } from '../src/utils/i18n';
import { useLanguage } from '../src/utils/LanguageContext';
import { ACHIEVEMENT_CATALOG, getRating, formatDate } from '../src/utils/gameLogic';
import { StorageService } from '../src/storage/storage';
import PrimaryButton from '../src/components/PrimaryButton';
import StatCard from '../src/components/StatCard';
import { useThemeColors } from '../src/utils/ThemeContext';
import { getDailyMissionCopy } from '../src/utils/dailyMissions';

export default function ResultScreen() {
  const router = useRouter();
  const { resultJson } = useLocalSearchParams<{ resultJson: string }>();
  const { language } = useLanguage();
  const colors = useThemeColors();

  const result = useMemo<QuizResult | null>(() => {
    if (!resultJson) return null;
    try {
      return JSON.parse(resultJson);
    } catch {
      return null;
    }
  }, [resultJson]);
  const newAchievements = useMemo(() => {
    if (!result?.newAchievementIds?.length) return [];
    return ACHIEVEMENT_CATALOG.filter((achievement) => result.newAchievementIds?.includes(achievement.id));
  }, [result]);

  const scoreAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const recordAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef<ViewShotRef>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [sharingCard, setSharingCard] = useState(false);
  const [missions, setMissions] = useState<DailyMissionState | null>(() => result?.dailyMissions ?? null);
  const [claimingMission, setClaimingMission] = useState<DailyMissionId | null>(null);

  useEffect(() => {
    setMissions(result?.dailyMissions ?? null);
  }, [result?.id]);

  useEffect(() => {
    if (!result) return;
    StorageService.getQuizHistory().then((history) => {
      const previousBest = history
        .filter((entry) => entry.id !== result.id)
        .reduce((best, entry) => Math.max(best, entry.score), 0);
      setBestScore(Math.max(previousBest, result.score));
      setIsNewRecord(result.score > 0 && result.score > previousBest);
    });
  }, [result]);

  useEffect(() => {
    if (!result) return;
    const target = result.score;
    const duration = 1200;
    const steps = 40;
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += Math.ceil(target / steps);
      if (current >= target) {
        setDisplayScore(target);
        clearInterval(timer);
      } else {
        setDisplayScore(current);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [result?.score]);

  useEffect(() => {
    Animated.stagger(200, [
      Animated.spring(scoreAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scoreAnim, cardAnim]);

  useEffect(() => {
    if (!isNewRecord) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(recordAnim, { toValue: 0.7, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, [isNewRecord]);

  if (!result) {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Hakuna matokeo!</Text>
        </View>
      </LinearGradient>
    );
  }

  const rating = getRating(result.correctAnswers, result.totalQuestions, language);
  const accuracy = result.accuracy;

  const handleShare = async () => {
    const cat = result.categoryName;
    const acc = result.accuracy;
    const streak = result.maxStreak;
    const shareText = language === 'sw'
      ? `Nimepata ${result.score} alama kwenye "${cat}" katika Mtaa Quiz Battle!\nUsahihi: ${acc}% | Mfululizo: ${streak}\nUnaweza kunizidi? 🎯🔥`
      : `I scored ${result.score} pts on "${cat}" in Mtaa Quiz Battle!\nAccuracy: ${acc}% | Streak: ${streak}\nCan you beat me? 🎯🔥`;
    await Share.share({ message: shareText });
  };

  const handleShareCard = async () => {
    if (!viewShotRef.current) return;
    setSharingCard(true);
    try {
      const uri = await (viewShotRef.current as unknown as { capture: () => Promise<string> }).capture();
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Mtaa Quiz Battle' });
      } else {
        Alert.alert('', t('shareCardFail'));
      }
    } catch {
      Alert.alert('', t('shareCardFail'));
      await handleShare();
    } finally {
      setSharingCard(false);
    }
  };

  const claimMission = async (mission: DailyMission) => {
    setClaimingMission(mission.id);
    try {
      const claimed = await StorageService.claimDailyMission(mission.id);
      if (!claimed.success) return;
      setMissions(claimed.missions);
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

  const getScoreColor = () => {
    const ratio = result.correctAnswers / result.totalQuestions;
    if (ratio >= 0.9) return colors.gold;
    if (ratio >= 0.7) return colors.secondary;
    if (ratio >= 0.5) return colors.primary;
    return colors.accent;
  };

  const getMedalEmoji = () => {
    const ratio = result.correctAnswers / result.totalQuestions;
    if (ratio >= 0.9) return '🥇';
    if (ratio >= 0.7) return '🥈';
    if (ratio >= 0.5) return '🥉';
    return '💪';
  };

  const reviewItems = result.reviewItems ?? [];
  const missedItems = reviewItems.filter((item) => !item.wasCorrect);
  const visibleReviewItems = showReview ? reviewItems : missedItems;

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Medal & score — wrapped in ViewShot for image capture */}
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1 }}
            style={{ borderRadius: Radius.xxl, overflow: 'hidden' }}
          >
            <Animated.View
              style={[
                styles.scoreSection,
                styles.scoreSectionCard,
                {
                  backgroundColor: colors.backgroundCard,
                  borderColor: colors.border,
                  transform: [{ scale: scoreAnim }],
                  opacity: scoreAnim,
                },
              ]}
            >
              <Text style={[styles.cardBrand, { color: colors.textMuted }]}>🇹🇿 Mtaa Quiz Battle</Text>
              <Text style={styles.medalEmoji}>{getMedalEmoji()}</Text>
              {isNewRecord && (
                <Animated.Text style={[styles.newRecordBadge, { opacity: recordAnim }]}>
                  {language === 'sw' ? '🏆 Rekodi Mpya!' : '🏆 New Record!'}
                </Animated.Text>
              )}
              <Text style={[styles.scoreValue, { color: getScoreColor() }]}>
                {displayScore}
              </Text>
              <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>{t('yourScore')}</Text>
              <Text style={[styles.ratingText, { color: colors.text }]}>{rating}</Text>
              <View style={styles.cardStatsRow}>
                <View style={styles.cardStat}>
                  <Text style={[styles.cardStatVal, { color: colors.secondary }]}>{result.correctAnswers}/{result.totalQuestions}</Text>
                  <Text style={[styles.cardStatLabel, { color: colors.textMuted }]}>{t('correctAnswers')}</Text>
                </View>
                <View style={[styles.cardStatDivider, { backgroundColor: colors.border }]} />
                <View style={styles.cardStat}>
                  <Text style={[styles.cardStatVal, { color: colors.primary }]}>{result.accuracy}%</Text>
                  <Text style={[styles.cardStatLabel, { color: colors.textMuted }]}>{t('accuracy')}</Text>
                </View>
                <View style={[styles.cardStatDivider, { backgroundColor: colors.border }]} />
                <View style={styles.cardStat}>
                  <Text style={[styles.cardStatVal, { color: colors.gold }]}>🔥{result.maxStreak}</Text>
                  <Text style={[styles.cardStatLabel, { color: colors.textMuted }]}>{t('streak')}</Text>
                </View>
              </View>
              <Text style={[styles.cardCategory, { color: colors.textMuted }]}>{result.categoryName}</Text>
            </Animated.View>
          </ViewShot>

          {/* Stats row */}
          <Animated.View style={[styles.statsRow, { opacity: cardAnim }]}>
            <StatCard
              label={t('correctAnswers')}
              value={`${result.correctAnswers}/${result.totalQuestions}`}
              emoji="✅"
              color={colors.secondary}
            />
            <StatCard
              label={t('accuracy')}
              value={`${accuracy}%`}
              emoji="🎯"
              color={colors.primary}
            />
            <StatCard
              label={t('coinsEarned')}
              value={result.coinsEarned}
              emoji="🪙"
              color={colors.gold}
            />
          </Animated.View>

          {newAchievements.length > 0 && (
            <Animated.View
              style={[
                styles.achievementCard,
                {
                  backgroundColor: colors.backgroundCard,
                  borderColor: colors.gold,
                  opacity: cardAnim,
                },
              ]}
            >
              <Text style={[styles.achievementHeading, { color: colors.gold }]}>
                {language === 'sw' ? 'Mafanikio Mapya' : 'New Achievement'}
              </Text>
              {newAchievements.map((achievement) => (
                <View
                  key={achievement.id}
                  style={[styles.achievementItem, { backgroundColor: colors.gold + '18' }]}
                >
                  <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
                  <View style={styles.achievementCopy}>
                    <Text style={[styles.achievementTitle, { color: colors.text }]}>
                      {language === 'sw' ? achievement.title : achievement.title_en}
                    </Text>
                    <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
                      {language === 'sw' ? achievement.description : achievement.description_en}
                    </Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          )}

          {missions && (
            <Animated.View
              style={[
                styles.missionsCard,
                {
                  backgroundColor: colors.backgroundCard,
                  borderColor: colors.border,
                  opacity: cardAnim,
                },
              ]}
            >
              <View style={styles.missionsHeader}>
                <View>
                  <Text style={[styles.missionsHeading, { color: colors.text }]}>
                    {language === 'sw' ? 'Maendeleo ya Leo' : "Today's Progress"}
                  </Text>
                  <Text style={[styles.missionsSubheading, { color: colors.textMuted }]}>
                    {language === 'sw' ? 'Misheni zako zimesasishwa' : 'Your missions were updated'}
                  </Text>
                </View>
                <Text style={styles.missionsEmoji}>🏅</Text>
              </View>
              {missions.missions.map((mission) => {
                const copy = getDailyMissionCopy(mission, language);
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
            </Animated.View>
          )}

          {/* Details card */}
          <Animated.View style={[styles.detailCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border, opacity: cardAnim }]}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🏷️ {t('categories')}</Text>
              <Text style={styles.detailValue}>{result.categoryName}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🔥 {t('streak')}</Text>
              <Text style={styles.detailValue}>{result.maxStreak}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>📅 {t('date')}</Text>
              <Text style={styles.detailValue}>{formatDate(result.date)}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>⭐ {t('bestScore')}</Text>
              <Text style={[styles.detailValue, { color: colors.gold }]}>{bestScore}</Text>
            </View>
          </Animated.View>

          {/* Answer breakdown dots */}
          <Animated.View style={[styles.breakdownCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border, opacity: cardAnim }]}>
            <Text style={[styles.breakdownTitle, { color: colors.textSecondary }]}>
              {language === 'sw' ? 'Muhtasari wa Majibu' : 'Answer Breakdown'}
            </Text>
            <View style={styles.breakdownRow}>
              {Array.from({ length: result.totalQuestions }).map((_, i) => {
                const hit = result.answerMap?.[i] ?? i < result.correctAnswers;
                return (
                  <View
                    key={i}
                    style={[
                      styles.breakdownDot,
                      { backgroundColor: hit ? colors.secondary : colors.accent },
                    ]}
                  />
                );
              })}
            </View>
            <View style={styles.breakdownLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
                <Text style={styles.legendText}>
                  {result.correctAnswers} {language === 'sw' ? 'Sahihi' : 'Correct'}
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.legendText}>
                  {result.totalQuestions - result.correctAnswers} {language === 'sw' ? 'Makosa' : 'Wrong'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {reviewItems.length > 0 && (
            <Animated.View style={[styles.reviewCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border, opacity: cardAnim }]}>
              <View style={styles.reviewHeader}>
                <View>
                  <Text style={[styles.breakdownTitle, { color: colors.textSecondary }]}>
                    {language === 'sw' ? 'Mapitio ya Majibu' : 'Answer Review'}
                  </Text>
                  <Text style={[styles.reviewSub, { color: colors.textMuted }]}>
                    {showReview
                      ? language === 'sw' ? 'Maswali yote' : 'All questions'
                      : language === 'sw' ? 'Maswali uliyokosa' : 'Missed questions'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.reviewToggle, { backgroundColor: colors.backgroundCardLight, borderColor: colors.border }]}
                  onPress={() => setShowReview((value) => !value)}
                  activeOpacity={0.78}
                >
                  <Text style={[styles.reviewToggleText, { color: colors.text }]}>
                    {showReview ? (language === 'sw' ? 'Makosa' : 'Missed') : (language === 'sw' ? 'Yote' : 'All')}
                  </Text>
                </TouchableOpacity>
              </View>
              {visibleReviewItems.length === 0 ? (
                <Text style={[styles.reviewEmpty, { color: colors.secondary }]}>
                  {language === 'sw' ? 'Hakuna ulichokosa. Safi sana.' : 'Nothing missed. Clean round.'}
                </Text>
              ) : (
                visibleReviewItems.map((item, index) => {
                  const question = language === 'en' && item.question_en ? item.question_en : item.question;
                  const explanation = language === 'en' && item.explanation_en ? item.explanation_en : item.explanation;
                  const correct = language === 'en' && item.correctAnswer_en ? item.correctAnswer_en : item.correctAnswer;
                  const selected = item.selectedAnswer ?? (language === 'sw' ? 'Muda uliisha' : 'Timed out');
                  const accent = item.wasCorrect ? colors.secondary : item.timedOut ? colors.timerLow : colors.accent;
                  return (
                    <View key={`${item.questionId}-${index}`} style={[styles.reviewItem, { borderColor: colors.border }]}>
                      <View style={styles.reviewItemHeader}>
                        <Text style={[styles.reviewBadge, { backgroundColor: accent + '22', color: accent, borderColor: accent }]}>
                          {item.timedOut
                            ? language === 'sw' ? 'Muda' : 'Time'
                            : item.wasCorrect
                            ? t('correct')
                            : t('wrong')}
                        </Text>
                        <Text style={[styles.reviewDifficulty, { color: accent }]}>{item.difficulty}</Text>
                      </View>
                      <Text style={[styles.reviewQuestion, { color: colors.text }]}>{question}</Text>
                      <Text style={[styles.reviewLine, { color: colors.textMuted }]}>
                        {language === 'sw' ? 'Jibu lako: ' : 'Your answer: '}{selected}
                      </Text>
                      <Text style={[styles.reviewLine, { color: colors.textSecondary }]}>
                        {language === 'sw' ? 'Sahihi: ' : 'Correct: '}{correct}
                      </Text>
                      <Text style={[styles.reviewExplanation, { color: colors.textSecondary }]}>{explanation}</Text>
                    </View>
                  );
                })
              )}
            </Animated.View>
          )}

          {/* Action buttons */}
          <View style={styles.buttonsCol}>
            {missedItems.length > 0 && (
              <PrimaryButton
                label={language === 'sw'
                  ? `Rudia makosa ${missedItems.length}`
                  : `Practice ${missedItems.length} missed`}
                onPress={() => router.replace({ pathname: '/quiz', params: { mode: 'practice' } })}
                color={colors.accent}
                textColor={colors.white}
                style={{ marginBottom: Spacing.sm }}
              />
            )}
            <PrimaryButton
              label={t('playAgain')}
              onPress={() =>
                result.isDaily
                  ? router.replace('/daily')
                  : router.replace({
                      pathname: '/quiz',
                      params: { categoryId: result.categoryId },
                    })
              }
              color={colors.primary}
              textColor={colors.black}
            />
            <PrimaryButton
              label={sharingCard ? t('generatingCard') : t('shareCard')}
              onPress={handleShareCard}
              color={colors.secondary}
              textColor={colors.white}
              style={{ marginTop: Spacing.sm }}
            />
            <PrimaryButton
              label={t('shareScore')}
              onPress={handleShare}
              color={colors.backgroundCardLight}
              textColor={colors.text}
              style={{ marginTop: Spacing.sm }}
            />
            <PrimaryButton
              label={t('chooseCategory')}
              onPress={() => router.replace('/categories')}
              color={colors.backgroundCardLight}
              textColor={colors.text}
              style={{ marginTop: Spacing.sm }}
            />
            <PrimaryButton
              label={t('backHome')}
              onPress={() => router.replace('/home')}
              color={colors.transparent}
              textColor={colors.textSecondary}
              style={{ marginTop: Spacing.xs }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: Colors.textSecondary, fontSize: Typography.fontSizes.lg },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.lg,
    alignItems: 'stretch',
  },
  scoreSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.xxl,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreSectionCard: {
    paddingHorizontal: Spacing.xl,
  },
  cardBrand: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  cardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  cardStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  cardStatVal: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.black,
  },
  cardStatLabel: {
    fontSize: Typography.fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardStatDivider: {
    width: 1,
    height: 36,
  },
  cardCategory: {
    fontSize: Typography.fontSizes.sm,
    marginTop: Spacing.base,
    fontWeight: Typography.fontWeights.medium,
  },
  medalEmoji: { fontSize: 64, marginBottom: Spacing.sm },
  scoreValue: {
    fontSize: Typography.fontSizes.display,
    fontWeight: Typography.fontWeights.black,
  },
  scoreLabel: {
    fontSize: Typography.fontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  ratingText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.text,
    textAlign: 'center',
    paddingHorizontal: Spacing.base,
  },
  newRecordBadge: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.black,
    color: Colors.gold,
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },

  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.base,
  },
  achievementCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  achievementHeading: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.black,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  achievementEmoji: {
    fontSize: 28,
  },
  achievementCopy: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  achievementDescription: {
    fontSize: Typography.fontSizes.sm,
    marginTop: 2,
  },
  missionsCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  missionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  missionsHeading: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.extraBold,
  },
  missionsSubheading: {
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
    minWidth: 72,
    alignItems: 'center',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  claimButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.black,
    letterSpacing: 0.4,
  },

  detailCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  detailLabel: {
    fontSize: Typography.fontSizes.md,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.text,
  },

  buttonsCol: {
    gap: 0,
  },

  breakdownCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  breakdownDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  breakdownLegend: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
  },
  reviewCard: {
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reviewSub: {
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
  },
  reviewToggle: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  reviewToggleText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
  },
  reviewEmpty: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  reviewItem: {
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  reviewBadge: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
  },
  reviewDifficulty: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    textTransform: 'uppercase',
  },
  reviewQuestion: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semiBold,
    lineHeight: Typography.fontSizes.md * 1.45,
    marginBottom: Spacing.xs,
  },
  reviewLine: {
    fontSize: Typography.fontSizes.sm,
    marginTop: 2,
  },
  reviewExplanation: {
    fontSize: Typography.fontSizes.sm,
    lineHeight: Typography.fontSizes.sm * 1.5,
    marginTop: Spacing.xs,
  },
});
