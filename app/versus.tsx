/**
 * Versus — Local pass-and-play mode for 2-4 players.
 * Each player answers the same 10 questions in turn (options re-shuffled
 * per player to keep it fair). Highest score wins; podium at the end.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HapticService } from '../src/utils/haptics';
import { SoundService } from '../src/services/SoundService';
import { getCategoryById, categories } from '../src/data/categories';
import { getRandomQuestions, getRandomQuestionsByCategory } from '../src/data/questions';
import { Typography, Spacing, Radius } from '../src/theme';
import { useLanguage } from '../src/utils/LanguageContext';
import { useThemeColors } from '../src/utils/ThemeContext';
import { QUESTION_TIME, shuffleOptions, calculateScore, evaluateAchievements } from '../src/utils/gameLogic';
import { StorageService } from '../src/storage/storage';
import { Question, VersusResult } from '../src/types';
import AnswerButton, { AnswerState } from '../src/components/AnswerButton';
import TimerBar from '../src/components/TimerBar';
import PrimaryButton from '../src/components/PrimaryButton';

const VERSUS_QUESTIONS = 10;
const MAX_PLAYERS = 4;
const PLAYER_ICONS = ['🟣', '🟠', '🟢', '🔵'];

type VersusPhase = 'setup' | 'playing' | 'handover' | 'results';

const playSound = (type: 'correct' | 'wrong' | 'timeup', enabled: boolean) =>
  SoundService.play(type, enabled);

export default function VersusScreen() {
  const router = useRouter();
  const { categoryId: catParam } = useLocalSearchParams<{ categoryId?: string }>();
  const { language } = useLanguage();
  const colors = useThemeColors();

  const [phase, setPhase] = useState<VersusPhase>('setup');
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '']);
  const [selectedCatId, setSelectedCatId] = useState(catParam ?? categories[0].id);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [answerStates, setAnswerStates] = useState<AnswerState[]>(['default', 'default', 'default', 'default']);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);

  const scoresRef = useRef<number[]>([0, 0, 0, 0]);
  const correctsRef = useRef<number[]>([0, 0, 0, 0]);
  const currentPlayerRef = useRef(0); // 0-based index
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

  const defaultName = useCallback(
    (i: number) => `${language === 'sw' ? 'Mchezaji' : 'Player'} ${i + 1}`,
    [language]
  );
  const nameOf = useCallback(
    (i: number) => playerNames[i]?.trim() || defaultName(i),
    [playerNames, defaultName]
  );

  const loadQuestions = useCallback(() => {
    const cat = getCategoryById(selectedCatId);
    const qs = cat
      ? getRandomQuestionsByCategory(cat.name, VERSUS_QUESTIONS)
      : getRandomQuestions(VERSUS_QUESTIONS);
    setQuestions(qs);
  }, [selectedCatId]);

  // Shuffle options for current question + current player
  useEffect(() => {
    if (questions.length === 0 || currentIndex >= questions.length) return;
    setOptions(shuffleOptions(questions[currentIndex], language));
  }, [questions, currentIndex, language, phase]);

  const stopTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  // Keep a ref to the latest handleTimeUp — startTimer's interval closure would
  // otherwise capture the first-render version (with empty questions) and crash.
  const handleTimeUpRef = useRef<() => void>(() => {});

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(QUESTION_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleTimeUpRef.current();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (phase === 'playing') {
      startTimer();
    }
    return () => stopTimer();
  }, [phase, currentIndex, startTimer]);

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
  handleTimeUpRef.current = handleTimeUp;

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
    const p = currentPlayerRef.current;
    if (isCorrect) {
      streakRef.current += 1;
      setDisplayStreak(streakRef.current);
      const { points } = calculateScore(timeLeft, QUESTION_TIME, streakRef.current, current.difficulty);
      scoresRef.current[p] += points;
      correctsRef.current[p] += 1;
      setDisplayScore(scoresRef.current[p]);
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
      if (currentPlayerRef.current < playerCount - 1) {
        setPhase('handover');
        setCurrentIndex(0);
        setDisplayScore(0);
        setDisplayStreak(0);
        streakRef.current = 0;
        currentPlayerRef.current += 1;
      } else {
        finishVersus();
      }
    } else {
      setCurrentIndex(nextIndex);
    }
    setAnswered(false);
    setAnswerStates(['default', 'default', 'default', 'default']);
  };

  const startMatch = () => {
    loadQuestions();
    scoresRef.current = [0, 0, 0, 0];
    correctsRef.current = [0, 0, 0, 0];
    currentPlayerRef.current = 0;
    streakRef.current = 0;
    setCurrentIndex(0);
    setDisplayScore(0);
    setDisplayStreak(0);
    setAnswered(false);
    setAnswerStates(['default', 'default', 'default', 'default']);
    setPhase('playing');
  };

  /** Players ranked by score (descending), keeping original index. */
  const ranking = () =>
    Array.from({ length: playerCount }, (_, i) => ({
      index: i,
      name: nameOf(i),
      score: scoresRef.current[i],
      correct: correctsRef.current[i],
    })).sort((a, b) => b.score - a.score);

  const finishVersus = async () => {
    setPhase('results');
    const ranked = ranking();
    const isDraw = ranked.length >= 2 && ranked[0].score === ranked[1].score;
    const cat = getCategoryById(selectedCatId);

    // Persist top two for history compatibility (VersusResult is 2-player shaped)
    const versusResult: VersusResult = {
      id: `versus_${Date.now()}`,
      player1Name: ranked[0].name,
      player2Name: ranked[1]?.name ?? '',
      player1Score: ranked[0].score,
      player2Score: ranked[1]?.score ?? 0,
      player1Correct: ranked[0].correct,
      player2Correct: ranked[1]?.correct ?? 0,
      totalQuestions: VERSUS_QUESTIONS,
      categoryId: selectedCatId,
      categoryName: cat?.name ?? 'Mixed',
      winnerId: isDraw ? 'draw' : 'player1',
      date: new Date().toISOString(),
    };
    await StorageService.addVersusResult(versusResult);

    if (!isDraw) {
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
            <Text style={[styles.title, { color: colors.text }]}>🥊 Versus</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {language === 'sw' ? 'Pambana na marafiki kwenye kifaa kimoja!' : 'Battle your friends on the same device!'}
            </Text>

            {/* Player count */}
            <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>
                {language === 'sw' ? 'Wachezaji Wangapi?' : 'How Many Players?'}
              </Text>
              <View style={styles.countRow}>
                {[2, 3, 4].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[
                      styles.countChip,
                      { backgroundColor: colors.backgroundCardLight, borderColor: colors.border },
                      playerCount === n && { backgroundColor: colors.primary + '33', borderColor: colors.primary },
                    ]}
                    onPress={() => setPlayerCount(n)}
                    accessibilityRole="button"
                    accessibilityLabel={`${n} ${language === 'sw' ? 'wachezaji' : 'players'}`}
                  >
                    <Text style={[styles.countChipText, { color: playerCount === n ? colors.primary : colors.textSecondary }]}>
                      {n} 👤
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Player names */}
            <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{language === 'sw' ? 'Majina ya Wachezaji' : 'Player Names'}</Text>
              {Array.from({ length: playerCount }, (_, i) => (
                <TextInput
                  key={i}
                  style={[styles.nameInput, { color: colors.text, backgroundColor: colors.backgroundCardLight, borderColor: colors.border }]}
                  placeholder={`${PLAYER_ICONS[i]} ${defaultName(i)}...`}
                  placeholderTextColor={colors.textMuted}
                  value={playerNames[i]}
                  onChangeText={(text) =>
                    setPlayerNames((prev) => prev.map((n, j) => (j === i ? text : n)))
                  }
                  maxLength={16}
                />
              ))}
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
              onPress={startMatch}
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
    const prevPlayer = currentPlayerRef.current - 1;
    const nextPlayer = currentPlayerRef.current;
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        <View style={styles.handoverCenter}>
          <Text style={[styles.handoverEmoji]}>🔄</Text>
          <Text style={[styles.handoverTitle, { color: colors.text }]}>
            {nameOf(prevPlayer)} {language === 'sw' ? 'amekwisha!' : 'is done!'}
          </Text>
          <Text style={[styles.handoverScore, { color: colors.gold }]}>
            {language === 'sw' ? 'Alama' : 'Score'}: {scoresRef.current[prevPlayer]}
          </Text>
          <Text style={[styles.handoverSub, { color: colors.textSecondary }]}>
            {language === 'sw' ? `Sasa ${nameOf(nextPlayer)} acheze!` : `Now it's ${nameOf(nextPlayer)}'s turn!`}
          </Text>
          <Text style={[styles.handoverHint, { color: colors.textMuted }]}>
            {language === 'sw'
              ? `(Kabla ya kubonyeza, mpe ${nameOf(nextPlayer)} simu)`
              : `(Hand the device to ${nameOf(nextPlayer)} before tapping)`}
          </Text>
          <PrimaryButton
            label={language === 'sw' ? `▶ Anza Zamu ya ${nameOf(nextPlayer)}` : `▶ Start ${nameOf(nextPlayer)}'s turn`}
            onPress={() => setPhase('playing')}
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
    const ranked = ranking();
    const isDraw = ranked.length >= 2 && ranked[0].score === ranked[1].score;
    const medals = ['🥇', '🥈', '🥉', '4️⃣'];
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={[styles.title, { color: colors.text }]}>
              {isDraw ? '🤝' : '🏆'} {language === 'sw' ? 'Matokeo ya Versus' : 'Versus Results'}
            </Text>
            <Text style={[styles.winnerText, { color: colors.primary }]}>
              {isDraw
                ? (language === 'sw' ? 'Sare!' : "It's a draw!")
                : `${ranked[0].name} ${language === 'sw' ? 'ameshinda!' : 'wins!'} 🎉`}
            </Text>

            {ranked.map((p, rank) => (
              <View
                key={p.index}
                style={[
                  styles.podiumRow,
                  { backgroundColor: colors.backgroundCard, borderColor: colors.border },
                  rank === 0 && !isDraw && { borderColor: colors.gold, borderWidth: 2 },
                ]}
              >
                <Text style={styles.podiumMedal}>{isDraw && rank < 2 ? '🤝' : medals[rank]}</Text>
                <View style={styles.podiumInfo}>
                  <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
                    {PLAYER_ICONS[p.index]} {p.name}
                  </Text>
                  <Text style={[styles.podiumCorrect, { color: colors.textSecondary }]}>
                    {p.correct}/{VERSUS_QUESTIONS} {language === 'sw' ? 'sahihi' : 'correct'}
                  </Text>
                </View>
                <Text style={[styles.podiumScore, { color: rank === 0 ? colors.gold : colors.textSecondary }]}>
                  {p.score}
                </Text>
              </View>
            ))}

            <PrimaryButton
              label={language === 'sw' ? '🔁 Mchezo Mpya' : '🔁 New Match'}
              onPress={() => setPhase('setup')}
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

  // ── Playing screen (shared for all players) ───────────────────────────────
  const playerIdx = currentPlayerRef.current;
  const playerName = nameOf(playerIdx);

  const current = questions[currentIndex];
  if (!current) return null;
  const questionText = language === 'en' && current.question_en ? current.question_en : current.question;
  const timerColor = timeLeft <= 5 ? colors.timerLow : timeLeft <= 10 ? colors.timer : colors.secondary;
  const isLastPlayer = playerIdx >= playerCount - 1;

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={[styles.playerBadge, { color: colors.primary, backgroundColor: colors.primary + '22' }]}>
            {PLAYER_ICONS[playerIdx]} {playerName}
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
            {language === 'sw' ? 'Swali' : 'Q'} {currentIndex + 1}/{VERSUS_QUESTIONS} · {playerIdx + 1}/{playerCount}
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
                key={`${currentIndex}-${playerIdx}-${idx}`}
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
                ? (!isLastPlayer
                    ? (language === 'sw' ? `Mpe ${nameOf(playerIdx + 1)} →` : `Hand to ${nameOf(playerIdx + 1)} →`)
                    : (language === 'sw' ? 'Ona Matokeo' : 'See Results'))
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
  countRow: { flexDirection: 'row', gap: Spacing.sm },
  countChip: { flex: 1, borderRadius: Radius.lg, borderWidth: 1, paddingVertical: Spacing.sm, alignItems: 'center' },
  countChipText: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold },
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
  podiumRow: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.base, marginBottom: Spacing.sm, gap: Spacing.md },
  podiumMedal: { fontSize: 28 },
  podiumInfo: { flex: 1 },
  podiumName: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold },
  podiumCorrect: { fontSize: Typography.fontSizes.sm },
  podiumScore: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.extraBold },
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
