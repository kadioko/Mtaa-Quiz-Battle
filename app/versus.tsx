/**
 * Versus — Local pass-and-play 1v1 mode.
 * Player 1 answers 10 questions, then Player 2 answers the same 10 questions.
 * Highest score wins. Both see the same shuffled options (re-shuffled for P2 to keep it fair).
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { HapticService } from '../src/utils/haptics';
import { getCategoryById, categories } from '../src/data/categories';
import { getRandomQuestions, getRandomQuestionsByCategory } from '../src/data/questions';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { useLanguage } from '../src/utils/LanguageContext';
import { useThemeColors } from '../src/utils/ThemeContext';
import { QUESTION_TIME, shuffleOptions, calculateScore, evaluateAchievements } from '../src/utils/gameLogic';
import { StorageService } from '../src/storage/storage';
import { Question, VersusResult } from '../src/types';
import AnswerButton, { AnswerState } from '../src/components/AnswerButton';
import TimerBar from '../src/components/TimerBar';
import PrimaryButton from '../src/components/PrimaryButton';

const VERSUS_QUESTIONS = 10;

type VersusPhase = 'setup' | 'p1-playing' | 'handover' | 'p2-playing' | 'results';

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

export default function VersusScreen() {
  const router = useRouter();
  const { categoryId: catParam } = useLocalSearchParams<{ categoryId?: string }>();
  const { language } = useLanguage();
  const colors = useThemeColors();

  const [phase, setPhase] = useState<VersusPhase>('setup');
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [selectedCatId, setSelectedCatId] = useState(catParam ?? categories[0].id);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [answerStates, setAnswerStates] = useState<AnswerState[]>(['default', 'default', 'default', 'default']);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);

  const p1ScoreRef = useRef(0);
  const p2ScoreRef = useRef(0);
  const p1CorrectRef = useRef(0);
  const p2CorrectRef = useRef(0);
  const currentPlayerRef = useRef<1 | 2>(1);
  const streakRef = useRef(0);

  const [displayScore, setDisplayScore] = useState(0);
  const [displayStreak, setDisplayStreak] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settings = useRef({ sound: true, vibration: true });

  useEffect(() => {
    StorageService.getSettings().then((s) => {
      settings.current = { sound: s.sound, vibration: s.vibration };
    });
  }, []);

  const loadQuestions = useCallback(() => {
    const cat = getCategoryById(selectedCatId);
    let qs: Question[];
    if (cat) {
      qs = getRandomQuestionsByCategory(cat.name, VERSUS_QUESTIONS);
    } else {
      qs = getRandomQuestions(VERSUS_QUESTIONS);
    }
    setQuestions(qs);
  }, [selectedCatId]);

  // Shuffle options for current question + current player
  useEffect(() => {
    if (questions.length === 0 || currentIndex >= questions.length) return;
    setOptions(shuffleOptions(questions[currentIndex], language));
  }, [questions, currentIndex, language, phase]);

  const stopTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(QUESTION_TIME);
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
  }, []);

  useEffect(() => {
    if (phase === 'p1-playing' || phase === 'p2-playing') {
      startTimer();
    }
    return () => stopTimer();
  }, [phase, currentIndex]);

  const handleTimeUp = () => {
    if (answered) return;
    setAnswered(true);
    const current = questions[currentIndex];
    const correctAnswer = language === 'en' && current.answer_en ? current.answer_en : current.answer;
    const correctIdx = options.indexOf(correctAnswer);
    setAnswerStates(options.map((_, i) => (i === correctIdx ? 'reveal' : 'default')));
    streakRef.current = 0;
    setDisplayStreak(0);
    HapticService.timeUp(settings.current.vibration);
    playSound('timeup', settings.current.sound);
  };

  const handleAnswer = (option: string) => {
    if (answered) return;
    stopTimer();
    setAnswered(true);
    const current = questions[currentIndex];
    const correctAnswer = language === 'en' && current.answer_en ? current.answer_en : current.answer;
    const isCorrect = option === correctAnswer;
    setAnswerStates(options.map((opt) => {
      if (opt === correctAnswer) return 'correct';
      if (opt === option && !isCorrect) return 'wrong';
      return 'default';
    }));
    if (isCorrect) {
      streakRef.current += 1;
      setDisplayStreak(streakRef.current);
      const { points } = calculateScore(timeLeft, QUESTION_TIME, streakRef.current, current.difficulty);
      if (currentPlayerRef.current === 1) {
        p1ScoreRef.current += points;
        p1CorrectRef.current += 1;
      } else {
        p2ScoreRef.current += points;
        p2CorrectRef.current += 1;
      }
      setDisplayScore(currentPlayerRef.current === 1 ? p1ScoreRef.current : p2ScoreRef.current);
      HapticService.correctAnswer(settings.current.vibration);
      if ([3, 5, 10].includes(streakRef.current)) HapticService.streakMilestone(settings.current.vibration);
      playSound('correct', settings.current.sound);
    } else {
      streakRef.current = 0;
      setDisplayStreak(0);
      HapticService.wrongAnswer(settings.current.vibration);
      playSound('wrong', settings.current.sound);
    }
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      if (phase === 'p1-playing') {
        setPhase('handover');
        setCurrentIndex(0);
        setDisplayScore(0);
        setDisplayStreak(0);
        streakRef.current = 0;
        currentPlayerRef.current = 2;
      } else {
        finishVersus();
      }
    } else {
      setCurrentIndex(nextIndex);
    }
    setAnswered(false);
    setAnswerStates(['default', 'default', 'default', 'default']);
  };

  const startP2 = () => {
    setPhase('p2-playing');
  };

  const finishVersus = async () => {
    setPhase('results');
    const cat = getCategoryById(selectedCatId);
    let winnerId: 'player1' | 'player2' | 'draw' = 'draw';
    if (p1ScoreRef.current > p2ScoreRef.current) winnerId = 'player1';
    else if (p2ScoreRef.current > p1ScoreRef.current) winnerId = 'player2';

    const versusResult: VersusResult = {
      id: `versus_${Date.now()}`,
      player1Name: p1Name || (language === 'sw' ? 'Mchezaji 1' : 'Player 1'),
      player2Name: p2Name || (language === 'sw' ? 'Mchezaji 2' : 'Player 2'),
      player1Score: p1ScoreRef.current,
      player2Score: p2ScoreRef.current,
      player1Correct: p1CorrectRef.current,
      player2Correct: p2CorrectRef.current,
      totalQuestions: VERSUS_QUESTIONS,
      categoryId: selectedCatId,
      categoryName: cat?.name ?? 'Mixed',
      winnerId,
      date: new Date().toISOString(),
    };
    await StorageService.addVersusResult(versusResult);

    if (winnerId !== 'draw') {
      const existing = await StorageService.getUnlockedAchievements();
      const profile = await StorageService.getUserProfile();
      const updated = evaluateAchievements(profile, [], existing, { versusWins: 1 });
      if (updated.length !== existing.length) await StorageService.saveUnlockedAchievements(updated);
    }
  };

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <TouchableOpacity onPress={() => router.replace('/home')} style={styles.backBtn}>
              <Text style={[styles.backText, { color: colors.textMuted }]}>← {language === 'sw' ? 'Nyumbani' : 'Home'}</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>🥊 {language === 'sw' ? 'Versus' : 'Versus'}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {language === 'sw' ? 'Pambana na rafiki yako kwenye kifaa kimoja!' : 'Battle a friend on the same device!'}
            </Text>

            {/* Player names */}
            <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{language === 'sw' ? 'Majina ya Wachezaji' : 'Player Names'}</Text>
              <TextInput
                style={[styles.nameInput, { color: colors.text, backgroundColor: colors.backgroundCardLight, borderColor: colors.border }]}
                placeholder={language === 'sw' ? 'Mchezaji 1...' : 'Player 1...'}
                placeholderTextColor={colors.textMuted}
                value={p1Name}
                onChangeText={setP1Name}
                maxLength={16}
              />
              <TextInput
                style={[styles.nameInput, { color: colors.text, backgroundColor: colors.backgroundCardLight, borderColor: colors.border }]}
                placeholder={language === 'sw' ? 'Mchezaji 2...' : 'Player 2...'}
                placeholderTextColor={colors.textMuted}
                value={p2Name}
                onChangeText={setP2Name}
                maxLength={16}
              />
            </View>

            {/* Category picker */}
            <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{language === 'sw' ? 'Chagua Kategoria' : 'Choose Category'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catChip,
                      { backgroundColor: colors.backgroundCardLight, borderColor: colors.border },
                      selectedCatId === cat.id && { backgroundColor: cat.color + '33', borderColor: cat.color },
                    ]}
                    onPress={() => setSelectedCatId(cat.id)}
                  >
                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.catName, { color: selectedCatId === cat.id ? cat.color : colors.textSecondary }]}>
                      {language === 'en' ? cat.name_en : cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <PrimaryButton
              label={language === 'sw' ? '⚔️ Anza Mchezo' : '⚔️ Start Match'}
              onPress={() => {
                loadQuestions();
                currentPlayerRef.current = 1;
                p1ScoreRef.current = 0; p2ScoreRef.current = 0;
                p1CorrectRef.current = 0; p2CorrectRef.current = 0;
                setCurrentIndex(0);
                setDisplayScore(0);
                setDisplayStreak(0);
                streakRef.current = 0;
                setPhase('p1-playing');
              }}
              color={colors.primary}
              textColor={colors.black}
              style={styles.startBtn}
            />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Handover screen ───────────────────────────────────────────────────────
  if (phase === 'handover') {
    const p1 = p1Name || (language === 'sw' ? 'Mchezaji 1' : 'Player 1');
    const p2 = p2Name || (language === 'sw' ? 'Mchezaji 2' : 'Player 2');
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        <View style={styles.handoverCenter}>
          <Text style={[styles.handoverEmoji]}>🔄</Text>
          <Text style={[styles.handoverTitle, { color: colors.text }]}>
            {p1} {language === 'sw' ? 'amekwisha!' : 'is done!'}
          </Text>
          <Text style={[styles.handoverScore, { color: colors.gold }]}>
            {language === 'sw' ? 'Alama' : 'Score'}: {p1ScoreRef.current}
          </Text>
          <Text style={[styles.handoverSub, { color: colors.textSecondary }]}>
            {language === 'sw' ? `Sasa ${p2} acheze!` : `Now it's ${p2}'s turn!`}
          </Text>
          <Text style={[styles.handoverHint, { color: colors.textMuted }]}>
            {language === 'sw' ? '(Kabla ya kubonyeza, mpe mchezaji 2 simu)' : '(Hand the device to Player 2 before tapping)'}
          </Text>
          <PrimaryButton
            label={language === 'sw' ? `▶ Anza Zamu ya ${p2}` : `▶ Start ${p2}'s turn`}
            onPress={startP2}
            color={colors.secondary}
            textColor={colors.white}
            style={styles.startBtn}
          />
        </View>
      </LinearGradient>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (phase === 'results') {
    const p1 = p1Name || (language === 'sw' ? 'Mchezaji 1' : 'Player 1');
    const p2 = p2Name || (language === 'sw' ? 'Mchezaji 2' : 'Player 2');
    const p1Wins = p1ScoreRef.current > p2ScoreRef.current;
    const p2Wins = p2ScoreRef.current > p1ScoreRef.current;
    const draw = !p1Wins && !p2Wins;
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={[styles.title, { color: colors.text }]}>
              {draw ? '🤝' : '🏆'} {language === 'sw' ? 'Matokeo ya Versus' : 'Versus Results'}
            </Text>
            <Text style={[styles.winnerText, { color: colors.primary }]}>
              {draw
                ? (language === 'sw' ? 'Sare!' : "It's a draw!")
                : `${p1Wins ? p1 : p2} ${language === 'sw' ? 'ameshinda!' : 'wins!'} 🎉`}
            </Text>

            <View style={styles.versusRow}>
              <PlayerCard name={p1} score={p1ScoreRef.current} correct={p1CorrectRef.current} total={VERSUS_QUESTIONS} winner={p1Wins} colors={colors} language={language} />
              <Text style={[styles.vsText, { color: colors.textMuted }]}>VS</Text>
              <PlayerCard name={p2} score={p2ScoreRef.current} correct={p2CorrectRef.current} total={VERSUS_QUESTIONS} winner={p2Wins} colors={colors} language={language} />
            </View>

            <PrimaryButton
              label={language === 'sw' ? '🔁 Mchezo Mpya' : '🔁 New Match'}
              onPress={() => {
                p1ScoreRef.current = 0; p2ScoreRef.current = 0;
                p1CorrectRef.current = 0; p2CorrectRef.current = 0;
                currentPlayerRef.current = 1;
                setCurrentIndex(0);
                setDisplayScore(0);
                setDisplayStreak(0);
                streakRef.current = 0;
                setPhase('setup');
              }}
              color={colors.primary}
              textColor={colors.black}
              style={styles.startBtn}
            />
            <PrimaryButton
              label={language === 'sw' ? 'Rudi Nyumbani' : 'Back Home'}
              onPress={() => router.replace('/home')}
              color={colors.backgroundCardLight}
              textColor={colors.text}
              style={styles.startBtn}
            />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Playing screen (shared for both players) ──────────────────────────────
  const currentPlayer = currentPlayerRef.current;
  const playerName = currentPlayer === 1
    ? (p1Name || (language === 'sw' ? 'Mchezaji 1' : 'Player 1'))
    : (p2Name || (language === 'sw' ? 'Mchezaji 2' : 'Player 2'));

  const current = questions[currentIndex];
  if (!current) return null;
  const questionText = language === 'en' && current.question_en ? current.question_en : current.question;
  const timerColor = timeLeft <= 5 ? colors.timerLow : timeLeft <= 10 ? colors.timer : colors.secondary;

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={[styles.playerBadge, { color: colors.primary, backgroundColor: colors.primary + '22' }]}>
            {currentPlayer === 1 ? '🟣' : '🟠'} {playerName}
          </Text>
          <View style={[styles.scoreBadge, { backgroundColor: colors.backgroundCardLight }]}>
            <Text style={[styles.scoreText, { color: colors.gold }]}>⭐ {displayScore}</Text>
          </View>
          <View style={[styles.streakBadge, { backgroundColor: displayStreak >= 3 ? colors.streak + '33' : colors.backgroundCardLight }]}>
            <Text style={[styles.streakText, { color: displayStreak >= 3 ? colors.streak : colors.textSecondary }]}>🔥 {displayStreak}</Text>
          </View>
        </View>

        <View style={styles.progressInfo}>
          <Text style={[styles.qCounter, { color: colors.textMuted }]}>
            {language === 'sw' ? 'Swali' : 'Q'} {currentIndex + 1}/{VERSUS_QUESTIONS}
          </Text>
        </View>

        <View style={styles.timerRow}>
          <TimerBar timeLeft={timeLeft} totalTime={QUESTION_TIME} />
          <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}s</Text>
        </View>

        <ScrollView contentContainerStyle={styles.quizScroll}>
          <View style={[styles.questionCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Text style={[styles.questionText, { color: colors.text }]}>{questionText}</Text>
          </View>
          <View style={styles.options}>
            {options.map((opt, idx) => (
              <AnswerButton
                key={`${currentIndex}-${currentPlayer}-${idx}`}
                label={opt}
                state={answerStates[idx]}
                onPress={() => handleAnswer(opt)}
                disabled={answered}
                index={idx}
              />
            ))}
          </View>
          {answered && (
            <PrimaryButton
              label={currentIndex + 1 >= VERSUS_QUESTIONS
                ? (currentPlayer === 1 ? (language === 'sw' ? 'Mpe Mchezaji 2 →' : 'Hand to Player 2 →') : (language === 'sw' ? 'Ona Matokeo' : 'See Results'))
                : (language === 'sw' ? 'Swali Lijalo →' : 'Next →')}
              onPress={handleNext}
              color={colors.primary}
              textColor={colors.black}
              style={styles.nextBtn}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function PlayerCard({ name, score, correct, total, winner, colors, language }: {
  name: string; score: number; correct: number; total: number; winner: boolean; colors: any; language: string;
}) {
  return (
    <View style={[styles.playerCard, { backgroundColor: colors.backgroundCard, borderColor: winner ? colors.secondary : colors.border }]}>
      {winner && <Text style={styles.trophyIcon}>🏆</Text>}
      <Text style={[styles.playerCardName, { color: colors.text }]} numberOfLines={1}>{name}</Text>
      <Text style={[styles.playerCardScore, { color: colors.gold }]}>{score}</Text>
      <Text style={[styles.playerCardCorrect, { color: colors.textSecondary }]}>
        {correct}/{total} {language === 'sw' ? 'sahihi' : 'correct'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl, paddingBottom: Spacing.xxxl },
  backBtn: { marginBottom: Spacing.base },
  backText: { fontSize: Typography.fontSizes.sm },
  title: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.extraBold, textAlign: 'center', marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.fontSizes.md, textAlign: 'center', marginBottom: Spacing.xl },
  card: { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.base, marginBottom: Spacing.base, gap: Spacing.sm },
  cardLabel: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semiBold, textTransform: 'uppercase', letterSpacing: 0.8 },
  nameInput: { borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, fontSize: Typography.fontSizes.md },
  catScroll: { marginTop: Spacing.xs },
  catChip: { borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: Spacing.base, paddingVertical: Spacing.xs, marginRight: Spacing.xs, alignItems: 'center', gap: 2 },
  catEmoji: { fontSize: 18 },
  catName: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.medium },
  startBtn: { width: '100%', marginTop: Spacing.sm },
  handoverCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, gap: Spacing.base },
  handoverEmoji: { fontSize: 64 },
  handoverTitle: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold, textAlign: 'center' },
  handoverScore: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.extraBold },
  handoverSub: { fontSize: Typography.fontSizes.lg, textAlign: 'center' },
  handoverHint: { fontSize: Typography.fontSizes.sm, textAlign: 'center', fontStyle: 'italic', marginBottom: Spacing.base },
  winnerText: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold, textAlign: 'center', marginBottom: Spacing.xl },
  versusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  vsText: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.black },
  playerCard: { flex: 1, borderRadius: Radius.xl, borderWidth: 2, padding: Spacing.base, alignItems: 'center', gap: Spacing.xs },
  trophyIcon: { fontSize: 28 },
  playerCardName: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, textAlign: 'center' },
  playerCardScore: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.extraBold },
  playerCardCorrect: { fontSize: Typography.fontSizes.sm },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.xs, gap: Spacing.sm },
  playerBadge: { flex: 1, fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  scoreBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  scoreText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold },
  streakBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  streakText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold },
  progressInfo: { paddingHorizontal: Spacing.base, marginBottom: Spacing.xs },
  qCounter: { fontSize: Typography.fontSizes.sm },
  timerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.sm },
  timerText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold, minWidth: 28, textAlign: 'right' },
  quizScroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxxl },
  questionCard: { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.base },
  questionText: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semiBold, lineHeight: Typography.fontSizes.lg * 1.5 },
  options: { gap: Spacing.xs },
  nextBtn: { marginTop: Spacing.base },
});
