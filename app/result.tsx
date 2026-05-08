import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuizResult } from '../src/types';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { t } from '../src/utils/i18n';
import { useLanguage } from '../src/utils/LanguageContext';
import { getRating, formatDate } from '../src/utils/gameLogic';
import { StorageService } from '../src/storage/storage';
import PrimaryButton from '../src/components/PrimaryButton';
import StatCard from '../src/components/StatCard';

export default function ResultScreen() {
  const router = useRouter();
  const { resultJson } = useLocalSearchParams<{ resultJson: string }>();
  const { language } = useLanguage();

  const result: QuizResult = resultJson ? JSON.parse(resultJson) : null;

  const scoreAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const recordAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [prevBest, setPrevBest] = useState(0);

  useEffect(() => {
    if (!result) return;
    StorageService.getUserProfile().then((p) => {
      const prev = Math.max(0, p.bestScore - result.score);
      setPrevBest(prev > 0 ? prev : 0);
      setIsNewRecord(result.score > 0 && result.score >= p.bestScore && p.totalGamesPlayed > 1);
    });
  }, []);

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
      <LinearGradient colors={['#0F0F23', '#1A1A35']} style={styles.gradient}>
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
      ? `Nimepata ${result.score} alama kwenye "${cat}" katika Mtaa Quiz Battle!\nUsahihi: ${acc}% | Mfululizo: ${streak}\nUnaweza kunizidi? 🎯🇿🇳`
      : `I scored ${result.score} pts on "${cat}" in Mtaa Quiz Battle!\nAccuracy: ${acc}% | Streak: ${streak}\nCan you beat me? 🎯🇿🇳`;
    await Share.share({ message: shareText });
  };

  const getScoreColor = () => {
    const ratio = result.correctAnswers / result.totalQuestions;
    if (ratio >= 0.9) return Colors.gold;
    if (ratio >= 0.7) return Colors.secondary;
    if (ratio >= 0.5) return Colors.primary;
    return Colors.accent;
  };

  const getMedalEmoji = () => {
    const ratio = result.correctAnswers / result.totalQuestions;
    if (ratio >= 0.9) return '🥇';
    if (ratio >= 0.7) return '🥈';
    if (ratio >= 0.5) return '🥉';
    return '💪';
  };

  return (
    <LinearGradient colors={['#0F0F23', '#1A1A35']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Medal & score */}
          <Animated.View
            style={[
              styles.scoreSection,
              { transform: [{ scale: scoreAnim }], opacity: scoreAnim },
            ]}
          >
            <Text style={styles.medalEmoji}>{getMedalEmoji()}</Text>
            {isNewRecord && (
              <Animated.Text style={[styles.newRecordBadge, { opacity: recordAnim }]}>
                {language === 'sw' ? '🏆 Rekodi Mpya!' : '🏆 New Record!'}
              </Animated.Text>
            )}
            <Text style={[styles.scoreValue, { color: getScoreColor() }]}>
              {displayScore}
            </Text>
            <Text style={styles.scoreLabel}>{t('yourScore')}</Text>
            <Text style={styles.ratingText}>{rating}</Text>
          </Animated.View>

          {/* Stats row */}
          <Animated.View style={[styles.statsRow, { opacity: cardAnim }]}>
            <StatCard
              label={t('correctAnswers')}
              value={`${result.correctAnswers}/${result.totalQuestions}`}
              emoji="✅"
              color={Colors.secondary}
            />
            <StatCard
              label={t('accuracy')}
              value={`${accuracy}%`}
              emoji="🎯"
              color={Colors.primary}
            />
            <StatCard
              label={t('coinsEarned')}
              value={result.coinsEarned}
              emoji="🪙"
              color={Colors.gold}
            />
          </Animated.View>

          {/* Details card */}
          <Animated.View style={[styles.detailCard, { opacity: cardAnim }]}>
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
              <Text style={[styles.detailValue, { color: Colors.gold }]}>{Math.max(result.score, prevBest)}</Text>
            </View>
          </Animated.View>

          {/* Answer breakdown dots */}
          <Animated.View style={[styles.breakdownCard, { opacity: cardAnim }]}>
            <Text style={styles.breakdownTitle}>
              {language === 'sw' ? 'Muhtasari wa Majibu' : 'Answer Breakdown'}
            </Text>
            <View style={styles.breakdownRow}>
              {Array.from({ length: result.totalQuestions }).map((_, i) => {
                const hit = i < result.correctAnswers;
                return (
                  <View
                    key={i}
                    style={[
                      styles.breakdownDot,
                      { backgroundColor: hit ? Colors.secondary : Colors.accent },
                    ]}
                  />
                );
              })}
            </View>
            <View style={styles.breakdownLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
                <Text style={styles.legendText}>
                  {result.correctAnswers} {language === 'sw' ? 'Sahihi' : 'Correct'}
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
                <Text style={styles.legendText}>
                  {result.totalQuestions - result.correctAnswers} {language === 'sw' ? 'Makosa' : 'Wrong'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Action buttons */}
          <View style={styles.buttonsCol}>
            <PrimaryButton
              label={t('playAgain')}
              onPress={() =>
                router.replace({
                  pathname: '/quiz',
                  params: { categoryId: result.categoryId },
                })
              }
              color={Colors.primary}
              textColor={Colors.black}
            />
            <PrimaryButton
              label={t('shareScore')}
              onPress={handleShare}
              color={Colors.secondary}
              textColor={Colors.white}
              style={{ marginTop: Spacing.sm }}
            />
            <PrimaryButton
              label={t('chooseCategory')}
              onPress={() => router.replace('/categories')}
              color={Colors.backgroundCardLight}
              textColor={Colors.text}
              style={{ marginTop: Spacing.sm }}
            />
            <PrimaryButton
              label={t('backHome')}
              onPress={() => router.replace('/home')}
              color={Colors.transparent}
              textColor={Colors.textSecondary}
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
});
