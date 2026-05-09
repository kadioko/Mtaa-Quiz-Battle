import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  Alert,
  BackHandler,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { getCategoryById } from '../src/data/categories';
import { getDailyQuestions, getRandomQuestionsByCategory } from '../src/data/questions';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { t } from '../src/utils/i18n';
import { useLanguage } from '../src/utils/LanguageContext';
import {
  QUESTION_TIME,
  calculateScore,
  shuffleOptions,
  buildQuizResult,
} from '../src/utils/gameLogic';
import { StorageService } from '../src/storage/storage';
import { Question } from '../src/types';
import AnswerButton, { AnswerState } from '../src/components/AnswerButton';
import TimerBar from '../src/components/TimerBar';
import PrimaryButton from '../src/components/PrimaryButton';

const TOTAL_QUESTIONS = 10;
type QuizStatus = 'loading' | 'ready' | 'empty';

const playSound = async (type: 'correct' | 'wrong' | 'timeup', enabled: boolean) => {
  if (!enabled) return;
  try {
    const sources: Record<string, number> = {
      correct: require('../assets/sounds/correct.mp3'),
      wrong: require('../assets/sounds/wrong.mp3'),
      timeup: require('../assets/sounds/timeup.mp3'),
    };
    const { sound } = await Audio.Sound.createAsync(sources[type] as number, { shouldPlay: true, volume: 0.7 });
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) sound.unloadAsync();
    });
  } catch {
    // Sound files optional — silently fail if missing
  }
};

export default function QuizScreen() {
  const router = useRouter();
  const { categoryId, isDaily } = useLocalSearchParams<{
    categoryId: string;
    isDaily?: string;
  }>();
  const { language } = useLanguage();

  const [quizStatus, setQuizStatus] = useState<QuizStatus>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerStates, setAnswerStates] = useState<AnswerState[]>(['default', 'default', 'default', 'default']);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [answered, setAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanationExpanded, setExplanationExpanded] = useState(true);
  const [bonusText, setBonusText] = useState('');
  const [answerMap, setAnswerMap] = useState<(boolean | null)[]>(Array(TOTAL_QUESTIONS).fill(null));

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerMapRef = useRef<(boolean | null)[]>(Array(TOTAL_QUESTIONS).fill(null));
  const scoreRef = useRef(0);
  const correctCountRef = useRef(0);
  const maxStreakRef = useRef(0);
  const questionAnim = useRef(new Animated.Value(1)).current;
  const bonusAnim = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const floatOpacity = useRef(new Animated.Value(0)).current;
  const [floatText, setFloatText] = useState('');

  const settings = useRef({ sound: true, vibration: true });

  const resetQuizState = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const freshAnswerMap: (boolean | null)[] = Array(TOTAL_QUESTIONS).fill(null);
    answerMapRef.current = freshAnswerMap;
    scoreRef.current = 0;
    correctCountRef.current = 0;
    maxStreakRef.current = 0;

    setCurrentIndex(0);
    setShuffledOptions([]);
    setSelectedAnswer(null);
    setAnswerStates(['default', 'default', 'default', 'default']);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setTimeLeft(QUESTION_TIME);
    setAnswered(false);
    setShowExplanation(false);
    setExplanationExpanded(true);
    setBonusText('');
    setFloatText('');
    setAnswerMap(freshAnswerMap);
  }, []);

  const markAnswer = useCallback((index: number, isCorrect: boolean) => {
    setAnswerMap((prev) => {
      const next = [...prev];
      next[index] = isCorrect;
      answerMapRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    StorageService.getSettings().then((s) => {
      settings.current = { sound: s.sound, vibration: s.vibration };
    });
  }, []);

  useEffect(() => {
    resetQuizState();
    setQuizStatus('loading');

    let qs: Question[] = [];
    if (isDaily === 'true') {
      qs = getDailyQuestions(TOTAL_QUESTIONS);
    } else {
      const category = getCategoryById(categoryId ?? '');
      qs = category ? getRandomQuestionsByCategory(category.name, TOTAL_QUESTIONS) : [];
    }
    setQuestions(qs);
    setQuizStatus(qs.length > 0 ? 'ready' : 'empty');
  }, [categoryId, isDaily, resetQuizState]);

  useEffect(() => {
    if (questions.length > 0) {
      const opts = shuffleOptions(questions[currentIndex], language);
      setShuffledOptions(opts);
    }
  }, [questions, currentIndex, language]);

  const finishQuiz = useCallback(
    async (
      finalScore: number,
      finalCorrect: number,
      finalMaxStreak: number,
      finalAnswerMap: (boolean | null)[]
    ) => {
      const cat = isDaily === 'true'
        ? { id: 'daily', name: 'Daily Challenge' }
        : {
            id: categoryId ?? '',
            name: getCategoryById(categoryId ?? '')?.name ?? 'Unknown',
          };

      const result = buildQuizResult(
        cat.id,
        cat.name,
        finalScore,
        finalCorrect,
        questions.length,
        finalMaxStreak,
        isDaily === 'true',
        finalAnswerMap.slice(0, questions.length).map((answer) => answer === true)
      );

      const updatedProfile = await StorageService.updateProfileAfterGame(result);
      await StorageService.addQuizResult(result);
      await StorageService.addLeaderboardEntry({
        id: result.id,
        username: updatedProfile.username,
        score: finalScore,
        categoryName: cat.name,
        date: result.date,
        correctAnswers: finalCorrect,
        isDaily: isDaily === 'true',
      });

      if (isDaily === 'true') {
        const profile = await StorageService.getUserProfile();
        const today = new Date().toDateString();
        const dailyStreak = profile.lastDailyDate === new Date(Date.now() - 86400000).toDateString()
          ? profile.dailyStreak + 1
          : 1;
        await StorageService.saveUserProfile({
          ...profile,
          dailyCompleted: true,
          lastDailyDate: today,
          dailyStreak,
        });
      }

      router.replace({
        pathname: '/result',
        params: { resultJson: JSON.stringify(result) },
      });
    },
    [categoryId, isDaily, questions.length, router]
  );

  const handleTimeUp = useCallback(() => {
    if (answered) return;
    setAnswered(true);
    setShowExplanation(true);
    markAnswer(currentIndex, false);
    if (settings.current.vibration) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    playSound('timeup', settings.current.sound);
    const newStreak = 0;
    setStreak(newStreak);

    const current = questions[currentIndex];
    const correctAnswer = language === 'en' && current.answer_en
      ? current.answer_en
      : current.answer;
    const correctIdx = shuffledOptions.indexOf(correctAnswer);
    const newStates: AnswerState[] = shuffledOptions.map((_, i) =>
      i === correctIdx ? 'reveal' : 'default'
    );
    setAnswerStates(newStates);
  }, [answered, currentIndex, questions, shuffledOptions, language, markAnswer]);

  useEffect(() => {
    if (questions.length === 0 || answered) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [questions, currentIndex, answered, handleTimeUp]);

  const handleAnswer = (option: string) => {
    if (answered) return;
    clearInterval(timerRef.current!);
    setAnswered(true);
    setSelectedAnswer(option);

    const current = questions[currentIndex];
    const correctAnswer = language === 'en' && current.answer_en
      ? current.answer_en
      : current.answer;

    const isCorrect = option === correctAnswer;
    const newStates: AnswerState[] = shuffledOptions.map((opt) => {
      if (opt === correctAnswer) return 'correct';
      if (opt === option && !isCorrect) return 'wrong';
      return 'default';
    });
    setAnswerStates(newStates);

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);

      const { points, speedBonus, streakBonus, multiplier } = calculateScore(timeLeft, QUESTION_TIME, newStreak, current.difficulty);
      const nextScore = scoreRef.current + points;
      const nextCorrectCount = correctCountRef.current + 1;
      const nextMaxStreak = Math.max(maxStreakRef.current, newStreak);
      scoreRef.current = nextScore;
      correctCountRef.current = nextCorrectCount;
      maxStreakRef.current = nextMaxStreak;
      setScore(nextScore);
      setCorrectCount(nextCorrectCount);
      setMaxStreak(nextMaxStreak);

      setFloatText(`+${points}`);
      floatY.setValue(0);
      floatOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(floatY, { toValue: -48, duration: 900, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(floatOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]).start(() => setFloatText(''));

      markAnswer(currentIndex, true);

      if (settings.current.vibration) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      playSound('correct', settings.current.sound);

      let bonus = '';
      if (multiplier > 1) bonus = `${multiplier === 2 ? '🔴' : '🟡'} ×${multiplier} ${language === 'sw' ? 'Mgawo' : 'Multiplier'}!`;
      else if (streakBonus > 0) bonus = `🔥 ${t('streakBonus')} +${streakBonus}`;
      else if (speedBonus > 20) bonus = `⚡ ${t('speedBonus')} +${speedBonus}`;
      if (bonus) {
        setBonusText(bonus);
        Animated.sequence([
          Animated.timing(bonusAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.delay(800),
          Animated.timing(bonusAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setBonusText(''));
      }
    } else {
      markAnswer(currentIndex, false);
      setStreak(0);
      if (settings.current.vibration) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      playSound('wrong', settings.current.sound);
    }
    setShowExplanation(true);
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= questions.length) {
      finishQuiz(scoreRef.current, correctCountRef.current, maxStreakRef.current, answerMapRef.current);
      return;
    }

    Animated.sequence([
      Animated.timing(questionAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(questionAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    setCurrentIndex(nextIndex);
    setAnswered(false);
    setSelectedAnswer(null);
    setAnswerStates(['default', 'default', 'default', 'default']);
    setShowExplanation(false);
    setExplanationExpanded(true);
    setTimeLeft(QUESTION_TIME);
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        language === 'sw' ? 'Acha Mchezo?' : 'Quit Game?',
        language === 'sw' ? 'Je, unataka kuacha mchezo huu?' : 'Are you sure you want to quit?',
        [
          { text: t('cancel'), style: 'cancel' },
          { text: language === 'sw' ? 'Acha' : 'Quit', onPress: () => router.back(), style: 'destructive' },
        ]
      );
      return true;
    });
    return () => sub.remove();
  }, [router, language]);

  if (quizStatus === 'loading') {
    return (
      <LinearGradient colors={['#0F0F23', '#1A1A35']} style={styles.gradient}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </LinearGradient>
    );
  }

  if (quizStatus === 'empty') {
    return (
      <LinearGradient colors={['#0F0F23', '#1A1A35']} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>?</Text>
            <Text style={styles.emptyTitle}>{t('quizUnavailable')}</Text>
            <Text style={styles.emptyText}>{t('quizUnavailableDesc')}</Text>
            <PrimaryButton
              label={t('chooseCategory')}
              onPress={() => router.replace('/categories')}
              color={Colors.primary}
              textColor={Colors.black}
              style={styles.emptyButton}
            />
            <PrimaryButton
              label={t('backHome')}
              onPress={() => router.replace('/home')}
              color={Colors.backgroundCardLight}
              textColor={Colors.text}
              style={styles.emptyButton}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const current = questions[currentIndex];
  const questionText = language === 'en' && current.question_en
    ? current.question_en
    : current.question;
  const explanationText = language === 'en' && current.explanation_en
    ? current.explanation_en
    : current.explanation;

  const progress = (currentIndex + 1) / questions.length;
  const timerColor = timeLeft <= 5 ? Colors.timerLow : timeLeft <= 10 ? Colors.timer : Colors.secondary;

  return (
    <LinearGradient colors={['#0F0F23', '#1A1A35']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <Text style={styles.questionCounter}>
              {t('question')} {currentIndex + 1}/{questions.length}
            </Text>
          </View>
          <View style={styles.scoreBadgeWrap}>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>⭐ {score}</Text>
            </View>
            {floatText ? (
              <Animated.Text
                style={[
                  styles.floatScore,
                  { opacity: floatOpacity, transform: [{ translateY: floatY }] },
                ]}
              >
                {floatText}
              </Animated.Text>
            ) : null}
          </View>
          <View style={[styles.streakBadge, streak >= 3 && styles.streakActive]}>
            <Text style={styles.streakText}>🔥 {streak}</Text>
          </View>
        </View>

        {/* Question dot stepper */}
        <View style={styles.dotStepper}>
          {questions.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < currentIndex && answerMap[i] === true && styles.dotCorrect,
                i < currentIndex && answerMap[i] === false && styles.dotWrong,
                i === currentIndex && styles.dotCurrent,
                i > currentIndex && styles.dotFuture,
              ]}
            />
          ))}
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* Timer */}
        <View style={styles.timerRow}>
          <TimerBar timeLeft={timeLeft} totalTime={QUESTION_TIME} />
          <Text style={[styles.timerText, { color: timerColor }]}>
            {timeLeft}{t('sec')}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Question card */}
          <Animated.View style={[styles.questionCard, { opacity: questionAnim }]}>
            <View style={styles.difficultyRow}>
              <View style={[
                styles.difficultyBadge,
                {
                  backgroundColor:
                    current.difficulty === 'easy'
                      ? Colors.secondary + '33'
                      : current.difficulty === 'medium'
                      ? Colors.timer + '33'
                      : Colors.accent + '33',
                },
              ]}>
                <Text style={[
                  styles.difficultyText,
                  {
                    color:
                      current.difficulty === 'easy'
                        ? Colors.secondary
                        : current.difficulty === 'medium'
                        ? Colors.timer
                        : Colors.accent,
                  },
                ]}>
                  {current.difficulty === 'easy'
                    ? t('easyLevel')
                    : current.difficulty === 'medium'
                    ? t('mediumLevel')
                    : t('hardLevel')}
                </Text>
              </View>
            </View>
            <Text style={styles.questionText}>{questionText}</Text>
          </Animated.View>

          {/* Answers */}
          <View style={styles.answersContainer}>
            {shuffledOptions.map((opt, idx) => (
              <AnswerButton
                key={`${currentIndex}-${idx}`}
                label={opt}
                state={answerStates[idx]}
                onPress={() => handleAnswer(opt)}
                disabled={answered}
                index={idx}
              />
            ))}
          </View>

          {/* Bonus text */}
          {bonusText ? (
            <Animated.Text style={[styles.bonusText, { opacity: bonusAnim }]}>
              {bonusText}
            </Animated.Text>
          ) : null}

          {/* Explanation */}
          {showExplanation && (
            <View style={styles.explanationCard}>
              <TouchableOpacity
                style={styles.explanationHeader}
                onPress={() => setExplanationExpanded((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={styles.explanationTitle}>
                  {selectedAnswer === (language === 'en' && current.answer_en ? current.answer_en : current.answer)
                    ? `✅ ${t('correct')}`
                    : `❌ ${t('wrong')}`}
                </Text>
                <Text style={styles.explanationChevron}>
                  {explanationExpanded ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              {explanationExpanded && (
                <Text style={styles.explanationText}>{explanationText}</Text>
              )}
            </View>
          )}

          {/* Next button */}
          {answered && (
            <PrimaryButton
              label={
                currentIndex + 1 >= questions.length
                  ? t('finish')
                  : t('nextQuestion')
              }
              onPress={handleNext}
              color={Colors.primary}
              textColor={Colors.black}
              style={styles.nextBtn}
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
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, fontSize: Typography.fontSizes.lg },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 56,
    color: Colors.primary,
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.extraBold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.fontSizes.md * 1.6,
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    width: '100%',
    marginTop: Spacing.sm,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  topLeft: { flex: 1 },
  questionCounter: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.medium,
  },
  scoreBadgeWrap: {
    position: 'relative',
    alignItems: 'center',
  },
  scoreBadge: {
    backgroundColor: Colors.backgroundCardLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  floatScore: {
    position: 'absolute',
    top: 0,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.black,
    color: Colors.secondary,
  },
  scoreText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.gold,
    fontWeight: Typography.fontWeights.bold,
  },
  streakBadge: {
    backgroundColor: Colors.backgroundCardLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  streakActive: {
    backgroundColor: Colors.streak + '33',
    borderWidth: 1,
    borderColor: Colors.streak,
  },
  streakText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.streak,
    fontWeight: Typography.fontWeights.bold,
  },

  progressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.base,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },

  dotStepper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotCorrect: {
    backgroundColor: Colors.secondary,
  },
  dotWrong: {
    backgroundColor: Colors.accent,
  },
  dotCurrent: {
    backgroundColor: Colors.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotFuture: {
    backgroundColor: Colors.border,
    opacity: 0.4,
  },

  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  timerText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    minWidth: 32,
    textAlign: 'right',
  },

  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },

  questionCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  difficultyRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  difficultyBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  difficultyText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.text,
    lineHeight: Typography.fontSizes.lg * 1.5,
  },

  answersContainer: {
    marginBottom: Spacing.sm,
  },

  bonusText: {
    textAlign: 'center',
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },

  explanationCard: {
    backgroundColor: Colors.backgroundCardLight,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  explanationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  explanationChevron: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizes.xs,
  },
  explanationTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text,
    flex: 1,
  },
  explanationText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.textSecondary,
    lineHeight: Typography.fontSizes.md * 1.6,
  },

  nextBtn: {
    marginTop: Spacing.sm,
  },
});
