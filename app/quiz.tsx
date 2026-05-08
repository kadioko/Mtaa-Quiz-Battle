import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { getCategoryById } from '../src/data/categories';
import { getQuestionsByCategory } from '../src/data/questions';
import { getDailyQuestions } from '../src/data/questions';
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
  const [bonusText, setBonusText] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionAnim = useRef(new Animated.Value(1)).current;
  const bonusAnim = useRef(new Animated.Value(0)).current;

  const settings = useRef({ sound: true, vibration: true });

  useEffect(() => {
    StorageService.getSettings().then((s) => {
      settings.current = { sound: s.sound, vibration: s.vibration };
    });
  }, []);

  useEffect(() => {
    let qs: Question[] = [];
    if (isDaily === 'true') {
      qs = getDailyQuestions(TOTAL_QUESTIONS);
    } else {
      const pool = getCategoryById(categoryId ?? '')
        ? getQuestionsByCategory(
            getCategoryById(categoryId ?? '')?.name ?? ''
          )
        : [];
      qs = [...pool].sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);
    }
    setQuestions(qs);
  }, [categoryId, isDaily]);

  useEffect(() => {
    if (questions.length > 0) {
      const opts = shuffleOptions(questions[currentIndex], language);
      setShuffledOptions(opts);
    }
  }, [questions, currentIndex, language]);

  const finishQuiz = useCallback(
    async (finalScore: number, finalCorrect: number, finalMaxStreak: number) => {
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
        TOTAL_QUESTIONS,
        finalMaxStreak,
        isDaily === 'true'
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
    [categoryId, isDaily, router]
  );

  const handleTimeUp = useCallback(() => {
    if (answered) return;
    setAnswered(true);
    setShowExplanation(true);
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
  }, [answered, currentIndex, questions, shuffledOptions, language]);

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
      setMaxStreak((prev) => Math.max(prev, newStreak));
      setCorrectCount((prev) => prev + 1);

      const { points, speedBonus, streakBonus } = calculateScore(timeLeft, QUESTION_TIME, newStreak);
      setScore((prev) => prev + points);

      if (settings.current.vibration) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      playSound('correct', settings.current.sound);

      let bonus = '';
      if (streakBonus > 0) bonus = `🔥 ${t('streakBonus')} +${streakBonus}`;
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
      finishQuiz(score, correctCount, maxStreak);
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
    setTimeLeft(QUESTION_TIME);
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Acha Mchezo?',
        'Je, unataka kuacha mchezo huu?',
        [
          { text: t('cancel'), style: 'cancel' },
          { text: 'Acha', onPress: () => router.back(), style: 'destructive' },
        ]
      );
      return true;
    });
    return () => sub.remove();
  }, [router]);

  if (questions.length === 0) {
    return (
      <LinearGradient colors={['#0F0F23', '#1A1A35']} style={styles.gradient}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
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
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>⭐ {score}</Text>
          </View>
          <View style={[styles.streakBadge, streak >= 3 && styles.streakActive]}>
            <Text style={styles.streakText}>🔥 {streak}</Text>
          </View>
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
              <Text style={styles.explanationTitle}>
                {selectedAnswer === (language === 'en' && current.answer_en ? current.answer_en : current.answer)
                  ? `✅ ${t('correct')}`
                  : `❌ ${t('wrong')}`}
              </Text>
              <Text style={styles.explanationText}>{explanationText}</Text>
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
  scoreBadge: {
    backgroundColor: Colors.backgroundCardLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
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
  explanationTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
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
