import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  BackHandler,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCategoryById } from '../src/data/categories';
import { HapticService } from '../src/utils/haptics';
import { MusicService } from '../src/services/MusicService';
import { SoundService } from '../src/services/SoundService';
import { CloudService } from '../src/services/CloudService';
import { getDailyQuestions, getRandomQuestionsByCategory, getQuestionsByIds, getWeeklyQuestions, getWeekKey, getEventQuestions } from '../src/data/questions';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { t } from '../src/utils/i18n';
import { useLanguage } from '../src/utils/LanguageContext';
import {
  QUESTION_TIME,
  calculateScore,
  shuffleOptions,
  buildQuizResult,
  getAdaptiveDifficulty,
  applyDifficultyWeights,
  HINT_ELIMINATE_COST,
  HINT_SKIP_COST,
} from '../src/utils/gameLogic';
import { StorageService } from '../src/storage/storage';
import { Question } from '../src/types';
import AnswerButton, { AnswerState } from '../src/components/AnswerButton';
import TimerBar from '../src/components/TimerBar';
import PrimaryButton from '../src/components/PrimaryButton';
import { useThemeColors } from '../src/utils/ThemeContext';

const TOTAL_QUESTIONS = 10;
type QuizStatus = 'loading' | 'ready' | 'empty';
type AnswerOutcome = 'correct' | 'wrong' | 'timeout' | null;

const playSound = (type: 'correct' | 'wrong' | 'timeup', enabled: boolean) =>
  SoundService.play(type, enabled);

export default function QuizScreen() {
  const router = useRouter();
  const { categoryId, isDaily, mode, eventId, eventSeed, eventName, eventNameEn } = useLocalSearchParams<{
    categoryId: string;
    isDaily?: string;
    mode?: string;
    eventId?: string;
    eventSeed?: string;
    eventName?: string;
    eventNameEn?: string;
  }>();
  const isPractice = mode === 'practice';
  const isWeekly = mode === 'weekly';
  const isEvent = mode === 'event' && Boolean(eventId && eventSeed);
  const { language } = useLanguage();
  const colors = useThemeColors();

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
  const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>(Array(TOTAL_QUESTIONS).fill(null));
  const [answerOutcome, setAnswerOutcome] = useState<AnswerOutcome>(null);
  const [paused, setPaused] = useState(false);
  const [quitConfirmVisible, setQuitConfirmVisible] = useState(false);
  const [coins, setCoins] = useState(0);
  const [hintEliminated, setHintEliminated] = useState<number[]>([]);
  const [hintUsedThisQ, setHintUsedThisQ] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerMapRef = useRef<(boolean | null)[]>(Array(TOTAL_QUESTIONS).fill(null));
  const selectedAnswersRef = useRef<(string | null)[]>(Array(TOTAL_QUESTIONS).fill(null));
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
    const freshSelectedAnswers: (string | null)[] = Array(TOTAL_QUESTIONS).fill(null);
    answerMapRef.current = freshAnswerMap;
    selectedAnswersRef.current = freshSelectedAnswers;
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
    setSelectedAnswers(freshSelectedAnswers);
    setAnswerOutcome(null);
    setPaused(false);
    setQuitConfirmVisible(false);
    setHintEliminated([]);
    setHintUsedThisQ(false);
  }, []);

  const markAnswer = useCallback((index: number, isCorrect: boolean) => {
    setAnswerMap((prev) => {
      const next = [...prev];
      next[index] = isCorrect;
      answerMapRef.current = next;
      return next;
    });
  }, []);

  const markSelectedAnswer = useCallback((index: number, answer: string | null) => {
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[index] = answer;
      selectedAnswersRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    StorageService.getSettings().then((s) => {
      settings.current = { sound: s.sound, vibration: s.vibration };
      MusicService.setEnabled(s.music ?? true);
    });
    StorageService.getUserProfile().then((p) => setCoins(p.totalCoins));
  }, []);

  useEffect(() => {
    resetQuizState();
    setQuizStatus('loading');

    const load = async () => {
      let qs: Question[] = [];
      if (isPractice) {
        // Build a quiz from questions whose MOST RECENT answer was wrong.
        // Once you answer a question correctly it leaves the practice pool.
        const history = await StorageService.getQuizHistory();
        const missedIds: string[] = [];
        const seen = new Set<string>();
        for (const result of history) {
          for (const item of result.reviewItems ?? []) {
            if (seen.has(item.questionId)) continue; // newest outcome already recorded
            seen.add(item.questionId);
            if (!item.wasCorrect) missedIds.push(item.questionId);
          }
        }
        const pool = getQuestionsByIds(missedIds.slice(0, 40));
        qs = pool.sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);
      } else if (isEvent) {
        qs = getEventQuestions(eventSeed ?? '', TOTAL_QUESTIONS);
      } else if (isWeekly) {
        qs = getWeeklyQuestions(TOTAL_QUESTIONS);
      } else if (isDaily === 'true') {
        qs = getDailyQuestions(TOTAL_QUESTIONS);
      } else {
        const category = getCategoryById(categoryId ?? '');
        if (category) {
          const pool = getRandomQuestionsByCategory(category.name, category.questionCount);
          const history = await StorageService.getQuizHistory();
          const adaptive = getAdaptiveDifficulty(history, category.name);
          qs = adaptive.active
            ? applyDifficultyWeights(pool, adaptive.weights, TOTAL_QUESTIONS)
            : pool.slice(0, TOTAL_QUESTIONS);
        }
      }
      setQuestions(qs);
      setQuizStatus(qs.length > 0 ? 'ready' : 'empty');
      if (qs.length > 0) {
        MusicService.play(isDaily === 'true' || isPractice || isWeekly || isEvent ? 'default' : (categoryId ?? 'default'));
      }
    };
    load();
    return () => { MusicService.stop(); };
  }, [categoryId, isDaily, isPractice, isWeekly, isEvent, eventSeed, resetQuizState]);

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
      const cat = isEvent
        ? { id: 'event', name: (language === 'en' ? eventNameEn : eventName) ?? eventName ?? 'Live Event' }
        : isPractice
        ? { id: 'practice', name: language === 'en' ? 'Practice Mistakes' : 'Rudia Makosa' }
        : isWeekly
        ? { id: 'weekly', name: 'Weekly Challenge' }
        : isDaily === 'true'
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
        finalAnswerMap.slice(0, questions.length).map((answer) => answer === true),
        questions.map((question, index) => {
          // The stored answer is in the language the player used — map it to both
          const raw = selectedAnswersRef.current[index];
          let selectedSw = raw;
          let selectedEn = raw;
          if (raw && question.options_en) {
            const enIdx = question.options_en.indexOf(raw);
            const swIdx = question.options.indexOf(raw);
            if (enIdx >= 0) selectedSw = question.options[enIdx] ?? raw;
            else if (swIdx >= 0) selectedEn = question.options_en[swIdx] ?? raw;
          }
          return {
          questionId: question.id,
          question: question.question,
          question_en: question.question_en,
          category: question.category,
          selectedAnswer: selectedSw,
          selectedAnswer_en: selectedEn,
          correctAnswer: question.answer,
          correctAnswer_en: question.answer_en,
          explanation: question.explanation,
          explanation_en: question.explanation_en,
          difficulty: question.difficulty,
          wasCorrect: finalAnswerMap[index] === true,
          timedOut: selectedAnswersRef.current[index] === null && finalAnswerMap[index] === false,
          };
        })
      );

      const { profile: updatedProfile, achievementsUnlocked, newAchievementIds } = await StorageService.updateProfileAfterGame(result);
      result.newAchievementIds = newAchievementIds;
      if (achievementsUnlocked > 0) HapticService.achievementUnlock(settings.current.vibration);
      await StorageService.addQuizResult(result);
      // Practice rounds don't compete on leaderboards
      if (!isPractice) {
        await StorageService.addLeaderboardEntry({
          id: result.id,
          username: updatedProfile.username,
          score: finalScore,
          categoryName: cat.name,
          date: result.date,
          correctAnswers: finalCorrect,
          isDaily: isDaily === 'true',
        });
        // Best-effort cloud submission (silent on failure)
        CloudService.submitScore({
          displayName: updatedProfile.username,
          score: finalScore,
          categoryName: cat.name,
          categoryName_en: getCategoryById(categoryId ?? '')?.name_en,
          correctAnswers: finalCorrect,
          totalQuestions: questions.length,
          isDaily: isDaily === 'true',
        }).catch(() => {});
      }

      if (isWeekly) {
        await StorageService.markWeeklyCompleted(getWeekKey(), finalScore);
      }
      if (isEvent && eventId) {
        await StorageService.markEventCompleted(eventId);
      }

      if (isDaily === 'true') {
        const profile = await StorageService.getUserProfile();
        const today = new Date().toDateString();
        const dailyStreak = profile.lastDailyDate === today
          ? profile.dailyStreak // already completed today — don't reset the streak
          : profile.lastDailyDate === new Date(Date.now() - 86400000).toDateString()
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
    [categoryId, isDaily, isPractice, isWeekly, isEvent, eventId, eventName, eventNameEn, language, questions, router]
  );

  const handleTimeUp = useCallback(() => {
    if (answered) return;
    setAnswered(true);
    setShowExplanation(true);
    setAnswerOutcome('timeout');
    markSelectedAnswer(currentIndex, null);
    markAnswer(currentIndex, false);
    HapticService.timeUp(settings.current.vibration);
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
  }, [answered, currentIndex, questions, shuffledOptions, language, markAnswer, markSelectedAnswer]);

  useEffect(() => {
    if (questions.length === 0 || answered || paused) return;
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
  }, [questions, currentIndex, answered, paused, handleTimeUp]);

  const requestQuit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    // Mark as paused so the timer effect restarts when the dialog is dismissed
    setPaused(true);
    setQuitConfirmVisible(true);
  }, []);

  const confirmQuit = useCallback(() => {
    setQuitConfirmVisible(false);
    setPaused(false);
    router.replace('/home');
  }, [router]);

  const resumeQuiz = useCallback(() => {
    setPaused(false);
    setQuitConfirmVisible(false);
  }, []);

  const pauseQuiz = useCallback(() => {
    if (answered) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setPaused(true);
  }, [answered]);

  const handleAnswer = (option: string) => {
    if (answered) return;
    clearInterval(timerRef.current!);
    setAnswered(true);
    setSelectedAnswer(option);
    markSelectedAnswer(currentIndex, option);

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
      setAnswerOutcome('correct');
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

      HapticService.correctAnswer(settings.current.vibration);
      if ([3, 5, 10].includes(newStreak)) HapticService.streakMilestone(settings.current.vibration);
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
      setAnswerOutcome('wrong');
      markAnswer(currentIndex, false);
      setStreak(0);
      HapticService.wrongAnswer(settings.current.vibration);
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
    setAnswerOutcome(null);
    setTimeLeft(QUESTION_TIME);
    setHintEliminated([]);
    setHintUsedThisQ(false);
  };

  const handleHintEliminate = async () => {
    if (answered || hintUsedThisQ || coins < HINT_ELIMINATE_COST) return;
    const current = questions[currentIndex];
    const correctAnswer = language === 'en' && current.answer_en ? current.answer_en : current.answer;
    const wrongIndices = shuffledOptions
      .map((opt, i) => ({ opt, i }))
      .filter(({ opt }) => opt !== correctAnswer)
      .map(({ i }) => i);
    const toEliminate: number[] = [];
    const shuffledWrong = [...wrongIndices].sort(() => Math.random() - 0.5);
    for (const idx of shuffledWrong) {
      if (toEliminate.length < 2) toEliminate.push(idx);
    }
    setHintEliminated(toEliminate);
    setHintUsedThisQ(true);
    const profile = await StorageService.getUserProfile();
    const newCoins = profile.totalCoins - HINT_ELIMINATE_COST;
    await StorageService.saveUserProfile({ ...profile, totalCoins: newCoins });
    setCoins(newCoins);
    await StorageService.incrementHintsUsed();
  };

  const handleHintSkip = async () => {
    if (answered || coins < HINT_SKIP_COST) return;
    if (timerRef.current) clearInterval(timerRef.current);
    markAnswer(currentIndex, false);
    markSelectedAnswer(currentIndex, null);
    const profile = await StorageService.getUserProfile();
    const newCoins = profile.totalCoins - HINT_SKIP_COST;
    await StorageService.saveUserProfile({ ...profile, totalCoins: newCoins });
    setCoins(newCoins);
    await StorageService.incrementHintsUsed();
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      finishQuiz(scoreRef.current, correctCountRef.current, maxStreakRef.current, answerMapRef.current);
      return;
    }
    setCurrentIndex(nextIndex);
    setAnswered(false);
    setSelectedAnswer(null);
    setAnswerStates(['default', 'default', 'default', 'default']);
    setShowExplanation(false);
    setExplanationExpanded(true);
    setAnswerOutcome(null);
    setTimeLeft(QUESTION_TIME);
    setHintEliminated([]);
    setHintUsedThisQ(false);
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      requestQuit();
      return true;
    });
    return () => sub.remove();
  }, [requestQuit]);

  if (quizStatus === 'loading') {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        <View style={styles.loading}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('loading')}</Text>
        </View>
      </LinearGradient>
    );
  }

  if (quizStatus === 'empty') {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.emptyState}>
            <Text style={[styles.emptyEmoji, { color: colors.primary }]}>?</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {isPractice ? t('practiceMistakes') : t('quizUnavailable')}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {isPractice ? t('noMistakesYet') : t('quizUnavailableDesc')}
            </Text>
            <PrimaryButton
              label={t('chooseCategory')}
              onPress={() => router.replace('/categories')}
              color={colors.primary}
              textColor={colors.black}
              style={styles.emptyButton}
            />
            <PrimaryButton
              label={t('backHome')}
              onPress={() => router.replace('/home')}
              color={colors.backgroundCardLight}
              textColor={colors.text}
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
  const correctAnswer = language === 'en' && current.answer_en
    ? current.answer_en
    : current.answer;
  const category = getCategoryById(categoryId ?? '');
  const categoryColor = isDaily === 'true' ? colors.secondary : category?.color ?? colors.primary;
  const difficultyColor =
    current.difficulty === 'easy'
      ? colors.secondary
      : current.difficulty === 'medium'
      ? colors.timer
      : colors.accent;
  const explanationAccent =
    answerOutcome === 'correct' ? colors.correct : answerOutcome === 'timeout' ? colors.timerLow : colors.wrong;

  const progress = (currentIndex + 1) / questions.length;
  const timerColor = timeLeft <= 5 ? colors.timerLow : timeLeft <= 10 ? colors.timer : colors.secondary;

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <Text style={[styles.questionCounter, { color: colors.textSecondary }]}>
              {t('question')} {currentIndex + 1}/{questions.length}
            </Text>
          </View>
          <View style={styles.scoreBadgeWrap}>
            <View style={[styles.scoreBadge, { backgroundColor: colors.backgroundCardLight }]}>
              <Text style={styles.scoreText}>⭐ {score}</Text>
            </View>
            {floatText ? (
              <Animated.Text
                style={[
                  styles.floatScore,
                  { color: colors.secondary, opacity: floatOpacity, transform: [{ translateY: floatY }] },
                ]}
              >
                {floatText}
              </Animated.Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={[styles.pauseButton, { backgroundColor: colors.backgroundCardLight, borderColor: colors.border }]}
            onPress={pauseQuiz}
            activeOpacity={0.78}
          >
            <Text style={[styles.pauseText, { color: colors.text }]}>⏸</Text>
          </TouchableOpacity>
          <View style={[styles.streakBadge, { backgroundColor: colors.backgroundCardLight }, streak >= 3 && { backgroundColor: colors.streak + '33', borderColor: colors.streak }]}>
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
                { backgroundColor: colors.border },
                i < currentIndex && answerMap[i] === true && { backgroundColor: colors.secondary },
                i < currentIndex && answerMap[i] === false && { backgroundColor: colors.accent },
                i === currentIndex && { backgroundColor: colors.primary, width: 12, height: 12, borderRadius: 6 },
                i > currentIndex && { backgroundColor: colors.border, opacity: 0.4 },
              ]}
            />
          ))}
        </View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <Animated.View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
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
          <Animated.View style={[styles.questionCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border, opacity: questionAnim }]}>
            <View style={styles.difficultyRow}>
              <View style={[
                styles.difficultyBadge,
                {
                  backgroundColor: difficultyColor + '33',
                  borderColor: difficultyColor,
                },
              ]}>
                <Text style={[
                  styles.difficultyText,
                  {
                    color: difficultyColor,
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
            <Text style={[styles.questionText, { color: colors.text }]}>{questionText}</Text>
          </Animated.View>

          {/* Answers */}
          <View style={styles.answersContainer}>
            {shuffledOptions.map((opt, idx) => (
              <AnswerButton
                key={`${currentIndex}-${idx}`}
                label={opt}
                state={hintEliminated.includes(idx) ? 'wrong' : answerStates[idx]}
                onPress={() => handleAnswer(opt)}
                disabled={answered || hintEliminated.includes(idx)}
                index={idx}
              />
            ))}
          </View>

          {/* Hint bar */}
          {!answered && (
            <View style={styles.hintBar}>
              <TouchableOpacity
                style={[
                  styles.hintBtn,
                  { backgroundColor: colors.backgroundCardLight, borderColor: colors.border },
                  (hintUsedThisQ || coins < HINT_ELIMINATE_COST) && { opacity: 0.4 },
                ]}
                onPress={handleHintEliminate}
                disabled={hintUsedThisQ || coins < HINT_ELIMINATE_COST}
              >
                <Text style={[styles.hintBtnText, { color: colors.textSecondary }]}>
                  💡 {language === 'en' ? `Remove 2 (${HINT_ELIMINATE_COST}🪙)` : `Ondoa 2 (${HINT_ELIMINATE_COST}🪙)`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.hintBtn,
                  { backgroundColor: colors.backgroundCardLight, borderColor: colors.border },
                  (coins < HINT_SKIP_COST) && { opacity: 0.4 },
                ]}
                onPress={handleHintSkip}
                disabled={coins < HINT_SKIP_COST}
              >
                <Text style={[styles.hintBtnText, { color: colors.textSecondary }]}>
                  ⏭ {language === 'en' ? `Skip (${HINT_SKIP_COST}🪙)` : `Ruka (${HINT_SKIP_COST}🪙)`}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bonus text */}
          {bonusText ? (
            <Animated.Text style={[styles.bonusText, { color: colors.primary, opacity: bonusAnim }]}>
              {bonusText}
            </Animated.Text>
          ) : null}

          {/* Explanation */}
          {showExplanation && (
            <View style={[styles.explanationCard, { backgroundColor: colors.backgroundCardLight, borderColor: explanationAccent }]}>
              <TouchableOpacity
                style={styles.explanationHeader}
                onPress={() => setExplanationExpanded((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={[styles.explanationTitle, { color: colors.text }]}>
                  {answerOutcome === 'timeout'
                    ? `⏱ ${language === 'sw' ? 'Muda Umeisha' : "Time's Up"}`
                    : answerOutcome === 'correct'
                    ? `✅ ${t('correct')}`
                    : `❌ ${t('wrong')}`}
                </Text>
                <Text style={[styles.explanationChevron, { color: colors.textMuted }]}>
                  {explanationExpanded ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              {explanationExpanded && (
                <View>
                  <View style={styles.explanationMetaRow}>
                    <View style={[styles.metaPill, { backgroundColor: categoryColor + '22', borderColor: categoryColor }]}>
                      <Text style={[styles.metaText, { color: categoryColor }]}>
                        {isDaily === 'true'
                          ? t('dailyChallenge')
                          : language === 'en'
                          ? category?.name_en ?? current.category
                          : category?.name ?? current.category}
                      </Text>
                    </View>
                    <View style={[styles.metaPill, { backgroundColor: difficultyColor + '22', borderColor: difficultyColor }]}>
                      <Text style={[styles.metaText, { color: difficultyColor }]}>
                        {current.difficulty === 'easy'
                          ? t('easyLevel')
                          : current.difficulty === 'medium'
                          ? t('mediumLevel')
                          : t('hardLevel')}
                      </Text>
                    </View>
                  </View>
                  {answerOutcome === 'timeout' ? (
                    <Text style={[styles.correctAnswerText, { color: colors.timerLow }]}>
                      {language === 'sw' ? 'Muda umeisha. Jibu sahihi: ' : 'Time ran out. Correct answer: '}{correctAnswer}
                    </Text>
                  ) : null}
                  <Text style={[styles.explanationText, { color: colors.textSecondary }]}>{explanationText}</Text>
                </View>
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
              color={colors.primary}
              textColor={colors.black}
              style={styles.nextBtn}
            />
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={paused || quitConfirmVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.pauseCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Text style={[styles.pauseTitle, { color: colors.text }]}>
              {quitConfirmVisible
                ? language === 'sw' ? 'Acha mchezo?' : 'Quit game?'
                : language === 'sw' ? 'Mchezo umesimama' : 'Game paused'}
            </Text>
            <Text style={[styles.pauseScore, { color: colors.gold }]}>
              {language === 'sw' ? 'Alama' : 'Score'}: {scoreRef.current}
            </Text>
            <Text style={[styles.pauseSub, { color: colors.textSecondary }]}>
              {t('question')} {currentIndex + 1}/{questions.length} · {language === 'sw' ? 'Mfululizo' : 'Streak'} {streak}
            </Text>
            {!quitConfirmVisible ? (
              <PrimaryButton
                label={language === 'sw' ? 'Endelea' : 'Resume'}
                onPress={resumeQuiz}
                color={colors.secondary}
                textColor={colors.white}
                style={styles.modalButton}
              />
            ) : null}
            <PrimaryButton
              label={quitConfirmVisible ? (language === 'sw' ? 'Ndiyo, acha' : 'Yes, quit') : (language === 'sw' ? 'Acha mchezo' : 'Quit game')}
              onPress={quitConfirmVisible ? confirmQuit : requestQuit}
              color={colors.accent}
              textColor={colors.white}
              style={styles.modalButton}
            />
            <PrimaryButton
              label={t('cancel')}
              onPress={resumeQuiz}
              color={colors.backgroundCardLight}
              textColor={colors.text}
              style={styles.modalButton}
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
  pauseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.black,
    letterSpacing: 0,
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
    borderWidth: 1,
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

  hintBar: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  hintBtn: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  hintBtnText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
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
  explanationMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  metaPill: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  metaText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
  },
  correctAnswerText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    marginBottom: Spacing.xs,
  },

  nextBtn: {
    marginTop: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  pauseCard: {
    width: '100%',
    borderRadius: Radius.xxl,
    borderWidth: 1,
    padding: Spacing.xl,
  },
  pauseTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.extraBold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  pauseScore: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.black,
    textAlign: 'center',
  },
  pauseSub: {
    fontSize: Typography.fontSizes.md,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.base,
  },
  modalButton: {
    marginTop: Spacing.sm,
  },
});
