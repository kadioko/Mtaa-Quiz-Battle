import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { questions } from '../src/data/questions';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { useLanguage } from '../src/utils/LanguageContext';
import { useThemeColors } from '../src/utils/ThemeContext';
import {
  SPRINT_DURATION,
  shuffleOptions,
  calculateSprintCoins,
  evaluateAchievements,
} from '../src/utils/gameLogic';
import { StorageService } from '../src/storage/storage';
import { SprintResult, Question } from '../src/types';
import AnswerButton, { AnswerState } from '../src/components/AnswerButton';
import PrimaryButton from '../src/components/PrimaryButton';

type Phase = 'countdown' | 'playing' | 'finished';

const playSound = async (type: 'correct' | 'wrong' | 'timeup', enabled: boolean) => {
  if (!enabled) return;
  try {
    const sources: Record<string, number> = {
      correct: require('../assets/sounds/correct.mp3'),
      wrong: require('../assets/sounds/wrong.mp3'),
      timeup: require('../assets/sounds/timeup.mp3'),
    };
    const { sound } = await Audio.Sound.createAsync(sources[type] as number, { shouldPlay: true, volume: 0.7 });
    sound.setOnPlaybackStatusUpdate((s) => {
      if ('didJustFinish' in s && s.didJustFinish) sound.unloadAsync();
    });
  } catch {}
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SprintScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const colors = useThemeColors();

  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(SPRINT_DURATION);
  const [pool, setPool] = useState<Question[]>([]);
  const [poolIndex, setPoolIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [answerStates, setAnswerStates] = useState<AnswerState[]>(['default', 'default', 'default', 'default']);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [result, setResult] = useState<SprintResult | null>(null);
  const [bestScore, setBestScore] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const maxStreakRef = useRef(0);
  const streakRef = useRef(0);
  const totalRef = useRef(0);

  const settings = useRef({ sound: true, vibration: true });
  const floatY = useRef(new Animated.Value(0)).current;
  const floatOpacity = useRef(new Animated.Value(0)).current;
  const [floatText, setFloatText] = useState('');

  useEffect(() => {
    StorageService.getSettings().then((s) => {
      settings.current = { sound: s.sound, vibration: s.vibration };
    });
    StorageService.getSprintHistory().then((h) => {
      if (h.length > 0) setBestScore(Math.max(...h.map((r) => r.score)));
    });
    setPool(shuffleArray(questions));
  }, []);

  useEffect(() => {
    if (pool.length === 0) return;
    setOptions(shuffleOptions(pool[poolIndex % pool.length], language));
  }, [pool, poolIndex, language]);

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setPhase('playing');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Main sprint timer
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          finishSprint();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  const finishSprint = useCallback(async () => {
    setPhase('finished');
    const coins = calculateSprintCoins(scoreRef.current, correctRef.current);
    const sprintResult: SprintResult = {
      id: `sprint_${Date.now()}`,
      score: scoreRef.current,
      correctAnswers: correctRef.current,
      totalAnswered: totalRef.current,
      maxStreak: maxStreakRef.current,
      coinsEarned: coins,
      date: new Date().toISOString(),
    };
    setResult(sprintResult);
    await StorageService.addSprintResult(sprintResult);
    // Credit coins to profile
    const profile = await StorageService.getUserProfile();
    await StorageService.saveUserProfile({ ...profile, totalCoins: profile.totalCoins + coins });
    // Check sprint achievements
    const history = await StorageService.getSprintHistory();
    const sprintTotal = history.reduce((s, r) => s + r.totalAnswered, 0);
    const hintsUsed = await StorageService.getHintsUsed();
    const existing = await StorageService.getUnlockedAchievements();
    const updated = evaluateAchievements(profile, [], existing, { sprintTotal, hintsUsed });
    if (updated.length !== existing.length) await StorageService.saveUnlockedAchievements(updated);
    playSound('timeup', settings.current.sound);
    if (settings.current.vibration) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const handleAnswer = useCallback((option: string) => {
    if (answered || phase !== 'playing') return;
    setAnswered(true);

    const current = pool[poolIndex % pool.length];
    const correctAnswer = language === 'en' && current.answer_en ? current.answer_en : current.answer;
    const isCorrect = option === correctAnswer;

    const newStates: AnswerState[] = options.map((opt) => {
      if (opt === correctAnswer) return 'correct';
      if (opt === option && !isCorrect) return 'wrong';
      return 'default';
    });
    setAnswerStates(newStates);

    totalRef.current += 1;
    setTotalAnswered(totalRef.current);

    if (isCorrect) {
      streakRef.current += 1;
      setStreak(streakRef.current);
      const newMaxStreak = Math.max(maxStreakRef.current, streakRef.current);
      maxStreakRef.current = newMaxStreak;
      setMaxStreak(newMaxStreak);
      const pts = 50 + (streakRef.current >= 3 ? 20 : 0);
      scoreRef.current += pts;
      correctRef.current += 1;
      setScore(scoreRef.current);
      setCorrect(correctRef.current);
      setFloatText(`+${pts}`);
      floatY.setValue(0);
      floatOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(floatY, { toValue: -48, duration: 700, useNativeDriver: true }),
        Animated.sequence([Animated.delay(300), Animated.timing(floatOpacity, { toValue: 0, duration: 400, useNativeDriver: true })]),
      ]).start(() => setFloatText(''));
      if (settings.current.vibration) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSound('correct', settings.current.sound);
    } else {
      streakRef.current = 0;
      setStreak(0);
      if (settings.current.vibration) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      playSound('wrong', settings.current.sound);
    }

    // Auto-advance after brief highlight
    setTimeout(() => {
      setPoolIndex((i) => i + 1);
      setAnswerStates(['default', 'default', 'default', 'default']);
      setAnswered(false);
    }, 600);
  }, [answered, phase, pool, poolIndex, options, language, floatY, floatOpacity]);

  const timerColor = timeLeft <= 10 ? colors.accent : timeLeft <= 20 ? colors.timer : colors.secondary;
  const timerPct = timeLeft / SPRINT_DURATION;

  if (phase === 'countdown') {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        <View style={styles.countdownCenter}>
          <Text style={[styles.countdownTitle, { color: colors.textMuted }]}>
            {language === 'sw' ? 'Tayari?' : 'Ready?'}
          </Text>
          <Text style={[styles.countdownNum, { color: colors.primary }]}>
            {countdown > 0 ? countdown : '🏃'}
          </Text>
          <Text style={[styles.countdownSub, { color: colors.textSecondary }]}>
            {language === 'sw' ? 'Jibu maswali mengi katika 60 sek!' : 'Answer as many as you can in 60s!'}
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (phase === 'finished' && result) {
    const isNewBest = result.score > bestScore;
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.resultScroll}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>
              {language === 'sw' ? '⏱️ Sprint Imekwisha!' : '⏱️ Sprint Over!'}
            </Text>
            {isNewBest && (
              <View style={[styles.newBestBadge, { backgroundColor: colors.gold + '22', borderColor: colors.gold }]}>
                <Text style={[styles.newBestText, { color: colors.gold }]}>
                  🏅 {language === 'sw' ? 'Rekodi Mpya!' : 'New Best!'}
                </Text>
              </View>
            )}
            <View style={[styles.resultCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <ResultRow emoji="⭐" label={language === 'sw' ? 'Alama' : 'Score'} value={result.score} colors={colors} />
              <ResultRow emoji="✅" label={language === 'sw' ? 'Sahihi' : 'Correct'} value={`${result.correctAnswers}/${result.totalAnswered}`} colors={colors} />
              <ResultRow emoji="🔥" label={language === 'sw' ? 'Mfululizo Mkubwa' : 'Best Streak'} value={result.maxStreak} colors={colors} />
              <ResultRow emoji="🪙" label={language === 'sw' ? 'Sarafu' : 'Coins'} value={`+${result.coinsEarned}`} colors={colors} />
            </View>
            <PrimaryButton
              label={language === 'sw' ? '🔁 Cheza Tena' : '🔁 Play Again'}
              onPress={() => {
                setPhase('countdown');
                setCountdown(3);
                setTimeLeft(SPRINT_DURATION);
                setScore(0); setCorrect(0); setStreak(0); setMaxStreak(0); setTotalAnswered(0);
                scoreRef.current = 0; correctRef.current = 0; streakRef.current = 0;
                maxStreakRef.current = 0; totalRef.current = 0;
                setPoolIndex(0);
                setPool(shuffleArray(questions));
                setResult(null);
              }}
              color={colors.primary}
              textColor={colors.black}
              style={styles.btn}
            />
            <PrimaryButton
              label={language === 'sw' ? 'Rudi Nyumbani' : 'Back Home'}
              onPress={() => router.replace('/home')}
              color={colors.backgroundCardLight}
              textColor={colors.text}
              style={styles.btn}
            />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const current = pool.length > 0 ? pool[poolIndex % pool.length] : null;
  if (!current) return null;
  const questionText = language === 'en' && current.question_en ? current.question_en : current.question;

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => { clearInterval(timerRef.current!); router.replace('/home'); }}
            style={[styles.exitBtn, { backgroundColor: colors.backgroundCardLight, borderColor: colors.border }]}
          >
            <Text style={[styles.exitText, { color: colors.text }]}>✕</Text>
          </TouchableOpacity>

          <View style={styles.timerBlock}>
            <View style={[styles.timerTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.timerFill, { backgroundColor: timerColor, width: `${timerPct * 100}%` }]} />
            </View>
            <Text style={[styles.timerNum, { color: timerColor }]}>{timeLeft}s</Text>
          </View>

          <View style={styles.scorePill}>
            {floatText ? (
              <Animated.Text style={[styles.floatScore, { color: colors.secondary, opacity: floatOpacity, transform: [{ translateY: floatY }] }]}>
                {floatText}
              </Animated.Text>
            ) : null}
            <View style={[styles.scoreBadge, { backgroundColor: colors.backgroundCardLight }]}>
              <Text style={[styles.scoreText, { color: colors.gold }]}>⭐ {score}</Text>
            </View>
          </View>
        </View>

        {/* Streak + count */}
        <View style={styles.statsRow}>
          <Text style={[styles.statChip, { color: colors.textSecondary }]}>
            {language === 'sw' ? `Maswali: ${totalAnswered}` : `Questions: ${totalAnswered}`}
          </Text>
          <View style={[styles.streakChip, { backgroundColor: streak >= 3 ? colors.streak + '33' : colors.backgroundCardLight }]}>
            <Text style={[styles.statChip, { color: streak >= 3 ? colors.streak : colors.textSecondary }]}>🔥 {streak}</Text>
          </View>
        </View>

        {/* Question */}
        <View style={[styles.questionCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <Text style={[styles.questionText, { color: colors.text }]}>{questionText}</Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {options.map((opt, idx) => (
            <AnswerButton
              key={`${poolIndex}-${idx}`}
              label={opt}
              state={answerStates[idx]}
              onPress={() => handleAnswer(opt)}
              disabled={answered}
              index={idx}
            />
          ))}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function ResultRow({ emoji, label, value, colors }: { emoji: string; label: string; value: string | number; colors: any }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultEmoji}>{emoji}</Text>
      <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.resultValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  countdownCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.base },
  countdownTitle: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold },
  countdownNum: { fontSize: 96, fontWeight: Typography.fontWeights.extraBold, lineHeight: 112 },
  countdownSub: { fontSize: Typography.fontSizes.md, textAlign: 'center', paddingHorizontal: Spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.xs, gap: Spacing.sm },
  exitBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  exitText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold },
  timerBlock: { flex: 1, gap: 4 },
  timerTrack: { height: 8, borderRadius: Radius.full, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: Radius.full },
  timerNum: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.black, textAlign: 'center' },
  scorePill: { position: 'relative', alignItems: 'center' },
  scoreBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  scoreText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold },
  floatScore: { position: 'absolute', top: -4, fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.black },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, marginBottom: Spacing.xs },
  statChip: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium },
  streakChip: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  questionCard: { marginHorizontal: Spacing.base, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.base, borderWidth: 1 },
  questionText: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semiBold, lineHeight: Typography.fontSizes.lg * 1.5 },
  options: { paddingHorizontal: Spacing.base, gap: Spacing.xs },
  resultScroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xxl, paddingBottom: Spacing.xxxl, alignItems: 'center' },
  resultTitle: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.extraBold, marginBottom: Spacing.base, textAlign: 'center' },
  newBestBadge: { borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: Spacing.base, paddingVertical: Spacing.xs, marginBottom: Spacing.base },
  newBestText: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold },
  resultCard: { width: '100%', borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.base, marginBottom: Spacing.xl },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  resultEmoji: { fontSize: 22 },
  resultLabel: { flex: 1, fontSize: Typography.fontSizes.md },
  resultValue: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold },
  btn: { width: '100%', marginTop: Spacing.sm },
});
