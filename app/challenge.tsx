/**
 * Challenge — Cross-device async multiplayer.
 *
 * Create: pick a category → play 10 questions → get a 6-char code to share.
 * Join: enter a friend's code → play the SAME 10 questions → ranked results.
 *
 * Uses the Supabase REST backend (CloudService). No realtime connection
 * needed — friends can play whenever they want and results accumulate.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HapticService } from '../src/utils/haptics';
import { SoundService } from '../src/services/SoundService';
import { CloudService } from '../src/services/CloudService';
import { getCategoryById, categories } from '../src/data/categories';
import { getRandomQuestionsByCategory, getQuestionsByIds } from '../src/data/questions';
import { Typography, Spacing, Radius } from '../src/theme';
import { useLanguage } from '../src/utils/LanguageContext';
import { useThemeColors } from '../src/utils/ThemeContext';
import { QUESTION_TIME, shuffleOptions, calculateScore, evaluateAchievements } from '../src/utils/gameLogic';
import { StorageService } from '../src/storage/storage';
import { Question, ChallengeAttempt } from '../src/types';
import AnswerButton, { AnswerState } from '../src/components/AnswerButton';
import TimerBar from '../src/components/TimerBar';
import PrimaryButton from '../src/components/PrimaryButton';

const CHALLENGE_QUESTIONS = 10;

type Phase = 'menu' | 'create-setup' | 'loading' | 'playing' | 'results' | 'error';

const playSound = (type: 'correct' | 'wrong' | 'timeup', enabled: boolean) =>
  SoundService.play(type, enabled);

export default function ChallengeScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const colors = useThemeColors();
  const sw = language === 'sw';

  const cloudAvailable = CloudService.isAvailable();

  const [phase, setPhase] = useState<Phase>('menu');
  const [errorMsg, setErrorMsg] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedCatId, setSelectedCatId] = useState(categories[0].id);
  const [code, setCode] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [isCreator, setIsCreator] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [answerStates, setAnswerStates] = useState<AnswerState[]>(['default', 'default', 'default', 'default']);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [displayScore, setDisplayScore] = useState(0);

  const [attempts, setAttempts] = useState<ChallengeAttempt[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [myCorrect, setMyCorrect] = useState(0);

  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const streakRef = useRef(0);
  const usernameRef = useRef('Mchezaji');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFinishingRef = useRef(false);
  const settings = useRef({ sound: true, vibration: true });

  useEffect(() => {
    StorageService.getSettings().then((s) => {
      settings.current = { sound: s.sound, vibration: s.vibration };
    });
    StorageService.getUserProfile().then((p) => { usernameRef.current = p.username; });
  }, []);

  useEffect(() => {
    if (questions.length === 0 || currentIndex >= questions.length) return;
    setOptions(shuffleOptions(questions[currentIndex], language));
  }, [questions, currentIndex, language]);

  const stopTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

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
    if (phase === 'playing') startTimer();
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
    if (isCorrect) {
      streakRef.current += 1;
      const { points } = calculateScore(timeLeft, QUESTION_TIME, streakRef.current, current.difficulty);
      scoreRef.current += points;
      correctRef.current += 1;
      setDisplayScore(scoreRef.current);
      HapticService.correctAnswer(settings.current.vibration);
      playSound('correct', settings.current.sound);
    } else {
      streakRef.current = 0;
      HapticService.wrongAnswer(settings.current.vibration);
      playSound('wrong', settings.current.sound);
    }
  };

  const resetPlayState = () => {
    isFinishingRef.current = false;
    scoreRef.current = 0;
    correctRef.current = 0;
    streakRef.current = 0;
    setDisplayScore(0);
    setCurrentIndex(0);
    setAnswered(false);
    setAnswerStates(['default', 'default', 'default', 'default']);
  };

  const fail = (msg: string) => {
    setErrorMsg(msg);
    setPhase('error');
  };

  // ── Create flow ─────────────────────────────────────────────────────────
  const handleCreate = async () => {
    const cat = getCategoryById(selectedCatId);
    if (!cat) return;
    setPhase('loading');
    const qs = getRandomQuestionsByCategory(cat.name, CHALLENGE_QUESTIONS);
    if (qs.length < CHALLENGE_QUESTIONS) {
      fail(sw ? 'Kundi hili halina maswali ya kutosha.' : 'This category has too few questions.');
      return;
    }
    const newCode = await CloudService.createChallenge({
      creatorName: usernameRef.current,
      categoryId: cat.id,
      categoryName: cat.name,
      questionIds: qs.map((q) => q.id),
    });
    if (!newCode) {
      fail(sw
        ? 'Imeshindikana kuunda changamoto. Hakikisha una intaneti.'
        : 'Could not create the challenge. Check your internet connection.');
      return;
    }
    setCode(newCode);
    setCreatorName(usernameRef.current);
    setCategoryLabel(language === 'en' ? cat.name_en : cat.name);
    setIsCreator(true);
    setQuestions(qs);
    resetPlayState();
    setPhase('playing');
  };

  // ── Join flow ───────────────────────────────────────────────────────────
  const handleJoin = async () => {
    const trimmed = joinCode.trim().toUpperCase();
    if (trimmed.length < 4) return;
    setPhase('loading');
    const challenge = await CloudService.fetchChallenge(trimmed);
    if (!challenge) {
      fail(sw
        ? 'Changamoto haikupatikana. Hakikisha msimbo ni sahihi.'
        : 'Challenge not found. Double-check the code.');
      return;
    }
    const byId = new Map(getQuestionsByIds(challenge.questionIds).map((q) => [q.id, q]));
    const qs = challenge.questionIds
      .map((id) => byId.get(id))
      .filter((q): q is Question => Boolean(q));
    if (qs.length !== challenge.questionIds.length || qs.length < CHALLENGE_QUESTIONS) {
      fail(sw
        ? 'Maswali ya changamoto hii hayapo kwenye toleo lako la programu. Sasisha programu.'
        : 'This challenge uses questions your app version does not have. Please update the app.');
      return;
    }
    setCode(challenge.code);
    setCreatorName(challenge.creatorName);
    const cat = getCategoryById(challenge.categoryId);
    setCategoryLabel(cat ? (language === 'en' ? cat.name_en : cat.name) : challenge.categoryName);
    setIsCreator(false);
    setQuestions(qs);
    resetPlayState();
    setPhase('playing');
  };

  // ── Finish: submit + load results ───────────────────────────────────────
  const finishChallenge = async () => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    setMyScore(scoreRef.current);
    setMyCorrect(correctRef.current);
    setPhase('results');
    setResultsLoading(true);
    await CloudService.submitChallengeAttempt({
      code,
      playerName: usernameRef.current,
      score: scoreRef.current,
      correctAnswers: correctRef.current,
      totalQuestions: questions.length,
    });
    const rows = await CloudService.fetchChallengeAttempts(code);
    setAttempts(rows);
    setResultsLoading(false);
    // Unlock the Challenger achievement
    const profile = await StorageService.getUserProfile();
    const existing = await StorageService.getUnlockedAchievements();
    const updated = evaluateAchievements(profile, [], existing, { challengePlayed: true });
    if (updated.length !== existing.length) await StorageService.saveUnlockedAchievements(updated);
  };

  const refreshResults = async () => {
    setResultsLoading(true);
    const rows = await CloudService.fetchChallengeAttempts(code);
    setAttempts(rows);
    setResultsLoading(false);
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      finishChallenge();
      return;
    }
    setCurrentIndex(nextIndex);
    setAnswered(false);
    setAnswerStates(['default', 'default', 'default', 'default']);
  };

  const shareCode = async () => {
    const msg = sw
      ? `Nakupa changamoto kwenye Mtaa Quiz Battle! 🏁\nKundi: ${categoryLabel}\nMsimbo: ${code}\nFungua app, chagua "Changamoto ya Marafiki", uweke msimbo huu. Nimepata alama ${myScore} — unizidi kama unaweza! 🔥`
      : `I challenge you on Mtaa Quiz Battle! 🏁\nCategory: ${categoryLabel}\nCode: ${code}\nOpen the app, choose "Friend Challenge" and enter this code. I scored ${myScore} — beat me if you can! 🔥`;
    try {
      await Share.share({ message: msg });
    } catch {}
  };

  const Header = ({ title }: { title: string }) => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => (phase === 'menu' ? router.back() : setPhase('menu'))}
        style={[styles.backBtn, { backgroundColor: colors.backgroundCardLight }]}
        accessibilityRole="button"
        accessibilityLabel={sw ? 'Rudi nyuma' : 'Go back'}
      >
        <Text style={[styles.backIcon, { color: colors.text }]}>‹</Text>
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  // ── Menu ────────────────────────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <Header title={sw ? '🏁 Changamoto ya Marafiki' : '🏁 Friend Challenge'} />
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {sw
                ? 'Cheza maswali yale yale na marafiki kwenye simu zao — popote walipo!'
                : 'Play the exact same questions as your friends on their own phones — wherever they are!'}
            </Text>

            {!cloudAvailable && (
              <View style={[styles.noticeCard, { backgroundColor: colors.backgroundCard, borderColor: colors.accent }]}>
                <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                  {sw
                    ? '⚠️ Huduma ya mtandaoni haijasanidiwa (SUPABASE env). Changamoto za marafiki zinahitaji intaneti.'
                    : '⚠️ Cloud backend is not configured (SUPABASE env vars). Friend challenges need an internet connection.'}
                </Text>
              </View>
            )}

            {/* Create */}
            <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                ✨ {sw ? 'Unda Changamoto' : 'Create a Challenge'}
              </Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                {sw
                  ? 'Chagua kundi, cheza, kisha tuma msimbo kwa marafiki.'
                  : 'Pick a category, play, then share the code with friends.'}
              </Text>
              <PrimaryButton
                label={sw ? 'Unda' : 'Create'}
                onPress={() => setPhase('create-setup')}
                color={colors.primary}
                textColor={colors.black}
                style={styles.cardBtn}
              />
            </View>

            {/* Join */}
            <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                🎟️ {sw ? 'Jiunge kwa Msimbo' : 'Join with a Code'}
              </Text>
              <TextInput
                style={[styles.codeInput, { color: colors.text, backgroundColor: colors.backgroundCardLight, borderColor: colors.border }]}
                placeholder="ABC123"
                placeholderTextColor={colors.textMuted}
                value={joinCode}
                onChangeText={(text) => setJoinCode(text.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
              />
              <PrimaryButton
                label={sw ? 'Jiunge' : 'Join'}
                onPress={handleJoin}
                color={colors.secondary}
                textColor={colors.white}
                style={styles.cardBtn}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Create setup (category picker) ──────────────────────────────────────
  if (phase === 'create-setup') {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <Header title={sw ? '✨ Unda Changamoto' : '✨ Create Challenge'} />
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {sw ? 'Chagua kundi la maswali:' : 'Choose a question category:'}
            </Text>
            <View style={styles.catGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catCard,
                    { backgroundColor: colors.backgroundCard, borderColor: colors.border },
                    selectedCatId === cat.id && { backgroundColor: cat.color + '22', borderColor: cat.color },
                  ]}
                  onPress={() => setSelectedCatId(cat.id)}
                >
                  <Text style={styles.catCardEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[styles.catCardName, { color: selectedCatId === cat.id ? cat.color : colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {language === 'en' ? cat.name_en : cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <PrimaryButton
              label={sw ? '🏁 Anza na Upate Msimbo' : '🏁 Play & Get Code'}
              onPress={handleCreate}
              color={colors.primary}
              textColor={colors.black}
              style={styles.cardBtn}
            />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {sw ? 'Inapakia...' : 'Loading...'}
          </Text>
        </View>
      </LinearGradient>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.center}>
            <Text style={styles.errorEmoji}>😕</Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{errorMsg}</Text>
            <PrimaryButton
              label={sw ? 'Rudi' : 'Back'}
              onPress={() => setPhase('menu')}
              color={colors.primary}
              textColor={colors.black}
              style={{ marginTop: Spacing.lg, width: '70%' }}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const medals = ['🥇', '🥈', '🥉'];
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <Header title={sw ? '🏁 Matokeo ya Changamoto' : '🏁 Challenge Results'} />
          <ScrollView contentContainerStyle={styles.scroll}>
            {/* Code share card */}
            <View style={[styles.codeCard, { backgroundColor: colors.backgroundCard, borderColor: colors.primary }]}>
              <Text style={[styles.codeLabel, { color: colors.textMuted }]}>
                {sw ? 'Msimbo wa Changamoto' : 'Challenge Code'} · {categoryLabel}
              </Text>
              <Text style={[styles.codeValue, { color: colors.primary }]}>{code}</Text>
              <Text style={[styles.myScoreText, { color: colors.textSecondary }]}>
                {sw ? 'Alama zako' : 'Your score'}: <Text style={{ color: colors.gold, fontWeight: '900' }}>{myScore}</Text> ({myCorrect}/{questions.length})
              </Text>
              <PrimaryButton
                label={sw ? '📤 Tuma kwa Marafiki' : '📤 Share with Friends'}
                onPress={shareCode}
                color={colors.primary}
                textColor={colors.black}
                style={styles.cardBtn}
              />
            </View>

            {/* Standings */}
            <View style={styles.standingsHeader}>
              <Text style={[styles.standingsTitle, { color: colors.text }]}>
                {sw ? 'Orodha ya Washiriki' : 'Standings'}
              </Text>
              <TouchableOpacity onPress={refreshResults} accessibilityRole="button" accessibilityLabel={sw ? 'Pakia upya' : 'Refresh'}>
                <Text style={[styles.refreshText, { color: colors.primary }]}>🔄 {sw ? 'Pakia upya' : 'Refresh'}</Text>
              </TouchableOpacity>
            </View>
            {resultsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: Spacing.lg }} />
            ) : attempts.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {sw ? 'Bado hakuna washiriki wengine — tuma msimbo!' : 'No other players yet — share the code!'}
              </Text>
            ) : (
              attempts.map((a, i) => (
                <View
                  key={a.id}
                  style={[
                    styles.standingRow,
                    { backgroundColor: colors.backgroundCard, borderColor: colors.border },
                    i === 0 && { borderColor: colors.gold },
                  ]}
                >
                  <Text style={styles.standingMedal}>{medals[i] ?? `${i + 1}`}</Text>
                  <View style={styles.standingInfo}>
                    <Text style={[styles.standingName, { color: colors.text }]} numberOfLines={1}>
                      {a.playerName}{a.playerName === creatorName && isCreator === false ? ` 👑` : ''}
                    </Text>
                    <Text style={[styles.standingCorrect, { color: colors.textMuted }]}>
                      {a.correctAnswers}/{a.totalQuestions} {sw ? 'sahihi' : 'correct'}
                    </Text>
                  </View>
                  <Text style={[styles.standingScore, { color: i === 0 ? colors.gold : colors.textSecondary }]}>
                    {a.score}
                  </Text>
                </View>
              ))
            )}

            <PrimaryButton
              label={sw ? 'Rudi Nyumbani' : 'Back Home'}
              onPress={() => router.replace('/home')}
              color={colors.backgroundCardLight}
              textColor={colors.text}
              style={styles.cardBtn}
            />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Playing ─────────────────────────────────────────────────────────────
  const current = questions[currentIndex];
  if (!current) return null;
  const questionText = language === 'en' && current.question_en ? current.question_en : current.question;
  const timerColor = timeLeft <= 5 ? colors.timerLow : timeLeft <= 10 ? colors.timer : colors.secondary;

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <Text style={[styles.challengeBadge, { color: colors.primary, backgroundColor: colors.primary + '22' }]}>
            🏁 {isCreator ? (sw ? 'Changamoto Yako' : 'Your Challenge') : `vs ${creatorName}`}
          </Text>
          <View style={[styles.scoreBadge, { backgroundColor: colors.backgroundCardLight }]}>
            <Text style={[styles.scoreText, { color: colors.gold }]}>⭐ {displayScore}</Text>
          </View>
        </View>

        <View style={styles.progressInfo}>
          <Text style={[styles.qCounter, { color: colors.textMuted }]}>
            {sw ? 'Swali' : 'Q'} {currentIndex + 1}/{questions.length} · {categoryLabel}
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
                key={`${currentIndex}-${idx}`}
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
              label={currentIndex + 1 >= questions.length
                ? (sw ? 'Maliza na Uone Matokeo' : 'Finish & See Results')
                : (sw ? 'Swali Lijalo →' : 'Next →')}
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
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 28, lineHeight: 32 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold },
  subtitle: { fontSize: Typography.fontSizes.md, textAlign: 'center', marginBottom: Spacing.lg, lineHeight: Typography.fontSizes.md * 1.5 },
  noticeCard: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.base, marginBottom: Spacing.base },
  noticeText: { fontSize: Typography.fontSizes.sm, lineHeight: Typography.fontSizes.sm * 1.5 },
  card: { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.base, gap: Spacing.sm },
  cardTitle: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold },
  cardDesc: { fontSize: Typography.fontSizes.sm, lineHeight: Typography.fontSizes.sm * 1.5 },
  cardBtn: { marginTop: Spacing.sm },
  codeInput: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    textAlign: 'center',
    letterSpacing: 6,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  catCard: {
    width: '47%',
    flexGrow: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    alignItems: 'center',
    gap: 4,
  },
  catCardEmoji: { fontSize: 26 },
  catCardName: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semiBold, textAlign: 'center' },
  loadingText: { marginTop: Spacing.base, fontSize: Typography.fontSizes.md },
  errorEmoji: { fontSize: 48, marginBottom: Spacing.base },
  errorText: { fontSize: Typography.fontSizes.md, textAlign: 'center', lineHeight: Typography.fontSizes.md * 1.5 },
  codeCard: { borderRadius: Radius.xxl, borderWidth: 2, padding: Spacing.lg, alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.lg },
  codeLabel: { fontSize: Typography.fontSizes.xs, textTransform: 'uppercase', letterSpacing: 1 },
  codeValue: { fontSize: 40, fontWeight: Typography.fontWeights.black, letterSpacing: 8 },
  myScoreText: { fontSize: Typography.fontSizes.md },
  standingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  standingsTitle: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold },
  refreshText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semiBold },
  emptyText: { textAlign: 'center', fontSize: Typography.fontSizes.sm, marginVertical: Spacing.lg },
  standingRow: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.base, marginBottom: Spacing.xs, gap: Spacing.md },
  standingMedal: { fontSize: 22, minWidth: 30, textAlign: 'center' },
  standingInfo: { flex: 1 },
  standingName: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold },
  standingCorrect: { fontSize: Typography.fontSizes.xs },
  standingScore: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.extraBold },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.xs, gap: Spacing.sm },
  challengeBadge: { flex: 1, fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  scoreBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  scoreText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold },
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
