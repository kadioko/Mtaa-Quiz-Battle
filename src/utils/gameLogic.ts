import { Question, QuizResult, QuizReviewItem, PlayerRank, Achievement, AchievementId, CategoryMastery } from '../types';
import { categories } from '../data/categories';

export const QUESTION_TIME = 15;
export const BASE_SCORE = 100;
export const MAX_SPEED_BONUS = 50;
export const STREAK_BONUS = 30;
export const STREAK_THRESHOLD = 3;

export const getDifficultyMultiplier = (difficulty: 'easy' | 'medium' | 'hard'): number => {
  if (difficulty === 'hard') return 2;
  if (difficulty === 'medium') return 1.5;
  return 1;
};

export const calculateScore = (
  timeLeft: number,
  totalTime: number,
  streak: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): { points: number; speedBonus: number; streakBonus: number; multiplier: number } => {
  const speedRatio = timeLeft / totalTime;
  const speedBonus = Math.round(speedRatio * MAX_SPEED_BONUS);
  const streakBonus = streak >= STREAK_THRESHOLD ? STREAK_BONUS : 0;
  const multiplier = getDifficultyMultiplier(difficulty);
  const points = Math.round((BASE_SCORE + speedBonus + streakBonus) * multiplier);
  return { points, speedBonus, streakBonus, multiplier };
};

export const calculateCoins = (score: number, correctAnswers: number, total: number): number => {
  const accuracy = correctAnswers / total;
  const baseCoins = Math.floor(score / 50);
  const accuracyBonus = accuracy >= 0.8 ? 10 : accuracy >= 0.6 ? 5 : 0;
  return baseCoins + accuracyBonus;
};

export const getRating = (correct: number, total: number, lang: 'sw' | 'en' = 'sw'): string => {
  const ratio = correct / total;
  const ratings = {
    sw: {
      low: 'Leo mtaa umekupiga chenga! 😅',
      mid: 'Sio mbaya, unaanza kushika! 💪',
      high: 'Uko vizuri sana! 🔥',
      perfect: 'Wewe ni Bingwa wa Mtaa! 🏆',
    },
    en: {
      low: 'The streets schooled you today! 😅',
      mid: "Not bad, you're getting there! 💪",
      high: "You're doing great! 🔥",
      perfect: 'You are the Street Champion! 🏆',
    },
  };
  const r = ratings[lang];
  if (ratio <= 0.3) return r.low;
  if (ratio <= 0.6) return r.mid;
  if (ratio <= 0.8) return r.high;
  return r.perfect;
};

export const shuffleOptions = (question: Question, lang: 'sw' | 'en' = 'sw'): string[] => {
  const opts = lang === 'en' && question.options_en ? [...question.options_en] : [...question.options];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
};

export const buildQuizResult = (
  categoryId: string,
  categoryName: string,
  score: number,
  correctAnswers: number,
  totalQuestions: number,
  maxStreak: number,
  isDaily: boolean,
  answerMap?: boolean[],
  reviewItems?: QuizReviewItem[]
): QuizResult => {
  const coins = calculateCoins(score, correctAnswers, totalQuestions);
  return {
    id: `result_${Date.now()}`,
    categoryId,
    categoryName,
    score,
    correctAnswers,
    totalQuestions,
    answerMap,
    reviewItems,
    coinsEarned: coins,
    maxStreak,
    accuracy: Math.round((correctAnswers / totalQuestions) * 100),
    date: new Date().toISOString(),
    isDaily,
  };
};

export const ADAPTIVE_MIN_GAMES = 30;
export const ADAPTIVE_MIN_QUESTIONS = 200;
export const ADAPTIVE_HISTORY_WINDOW = 30;

export interface DifficultyWeights {
  easy: number;
  medium: number;
  hard: number;
}

export interface AdaptiveDifficultyResult {
  active: boolean;
  weights: DifficultyWeights;
  reason?: string;
}

export const getAdaptiveDifficulty = (
  history: QuizResult[],
  categoryName: string
): AdaptiveDifficultyResult => {
  const neutralWeights: DifficultyWeights = { easy: 1, medium: 1, hard: 1 };

  const nonDailyHistory = history.filter((r) => !r.isDaily);
  const totalGames = nonDailyHistory.length;
  const totalAnswered = nonDailyHistory.reduce((sum, r) => sum + r.totalQuestions, 0);

  if (totalGames < ADAPTIVE_MIN_GAMES || totalAnswered < ADAPTIVE_MIN_QUESTIONS) {
    return { active: false, weights: neutralWeights };
  }

  const recentWindow = nonDailyHistory
    .filter((r) => r.categoryName === categoryName)
    .slice(0, ADAPTIVE_HISTORY_WINDOW);

  if (recentWindow.length < 3) {
    return { active: false, weights: neutralWeights };
  }

  const perDifficulty: Record<string, { correct: number; total: number }> = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  };

  recentWindow.forEach((result) => {
    if (!result.reviewItems) return;
    result.reviewItems.forEach((item) => {
      const bucket = perDifficulty[item.difficulty];
      if (!bucket) return;
      bucket.total += 1;
      if (item.wasCorrect) bucket.correct += 1;
    });
  });

  const acc = (d: string): number | null => {
    const bucket = perDifficulty[d];
    return bucket.total >= 5 ? bucket.correct / bucket.total : null;
  };

  const easyAcc = acc('easy');
  const mediumAcc = acc('medium');

  const weights: DifficultyWeights = { easy: 1, medium: 1, hard: 1 };
  let didBias = false;

  if (easyAcc !== null && easyAcc >= 0.8) {
    weights.easy = 0.4;
    weights.medium = 1.4;
    weights.hard = 1.2;
    didBias = true;
  }
  if (mediumAcc !== null && mediumAcc >= 0.8) {
    weights.medium = 0.4;
    weights.hard = 1.6;
    didBias = true;
  }

  if (!didBias) {
    return { active: false, weights: neutralWeights };
  }

  return {
    active: true,
    weights,
    reason: `Adapted from ${recentWindow.length} recent ${categoryName} games`,
  };
};

export const applyDifficultyWeights = (
  questions: Question[],
  weights: DifficultyWeights,
  count: number
): Question[] => {
  const byDiff: Record<string, Question[]> = { easy: [], medium: [], hard: [] };
  questions.forEach((q) => byDiff[q.difficulty]?.push(q));

  const weightedPool: Question[] = [];
  (['easy', 'medium', 'hard'] as const).forEach((d) => {
    const w = Math.round(weights[d] * byDiff[d].length);
    const shuffled = [...byDiff[d]].sort(() => Math.random() - 0.5);
    weightedPool.push(...shuffled.slice(0, w));
  });

  return weightedPool.sort(() => Math.random() - 0.5).slice(0, count);
};

export const formatDate = (isoString: string): string => {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const isToday = (dateString: string): boolean => {
  if (!dateString) return false;
  return new Date(dateString).toDateString() === new Date().toDateString();
};

export const isYesterday = (dateString: string): boolean => {
  if (!dateString) return false;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  return new Date(dateString).toDateString() === yesterday;
};

// ── Player Ranks ──────────────────────────────────────────────────────────────

export const RANKS: PlayerRank[] = [
  { level: 1, title: 'Mgeni',        title_en: 'Newcomer',       emoji: '🌱', minCoins: 0,    color: '#8BC34A' },
  { level: 2, title: 'Mwanafunzi',   title_en: 'Student',        emoji: '📚', minCoins: 50,   color: '#29B6F6' },
  { level: 3, title: 'Mchezaji',     title_en: 'Player',         emoji: '🎮', minCoins: 150,  color: '#7E57C2' },
  { level: 4, title: 'Hodari',       title_en: 'Skilled',        emoji: '⚡', minCoins: 350,  color: '#FFA726' },
  { level: 5, title: 'Bingwa',       title_en: 'Champion',       emoji: '🏆', minCoins: 700,  color: '#EF5350' },
  { level: 6, title: 'Msomi',        title_en: 'Scholar',        emoji: '🧠', minCoins: 1200, color: '#26C6DA' },
  { level: 7, title: 'Simba wa Mtaa',title_en: 'Street Lion',    emoji: '🦁', minCoins: 2000, color: '#FF7043' },
  { level: 8, title: 'Mfalme',       title_en: 'King',           emoji: '👑', minCoins: 3500, color: '#FFD700' },
  { level: 9, title: 'Hadithi',      title_en: 'Legend',         emoji: '🌟', minCoins: 5000, color: '#F5A623' },
];

export const getPlayerRank = (totalCoins: number): PlayerRank => {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (totalCoins >= r.minCoins) rank = r;
    else break;
  }
  return rank;
};

export const getNextRank = (totalCoins: number): PlayerRank | null => {
  const current = getPlayerRank(totalCoins);
  return RANKS.find((r) => r.level === current.level + 1) ?? null;
};

// ── Achievement Catalog ───────────────────────────────────────────────────────

export const ACHIEVEMENT_CATALOG: Achievement[] = [
  { id: 'first_game',    emoji: '🎮', unlocked: false, title: 'Mchezo wa Kwanza', title_en: 'First Game',        description: 'Cheza mchezo wako wa kwanza',         description_en: 'Play your first game' },
  { id: 'games_10',      emoji: '🔟', unlocked: false, title: 'Mchezaji 10',      title_en: 'Played 10',         description: 'Cheza michezo 10',                    description_en: 'Play 10 games' },
  { id: 'games_50',      emoji: '5️⃣0️⃣', unlocked: false, title: 'Mchezaji 50',  title_en: 'Played 50',         description: 'Cheza michezo 50',                    description_en: 'Play 50 games' },
  { id: 'games_100',     emoji: '💯', unlocked: false, title: 'Mchezaji 100',     title_en: 'Played 100',        description: 'Cheza michezo 100',                   description_en: 'Play 100 games' },
  { id: 'streak_3',      emoji: '🔥', unlocked: false, title: 'Mfululizo 3',      title_en: 'Streak 3',          description: 'Pata mfululizo wa maswali 3',         description_en: 'Get a 3-question streak' },
  { id: 'streak_7',      emoji: '🔥🔥', unlocked: false, title: 'Mfululizo 7',    title_en: 'Streak 7',          description: 'Pata mfululizo wa maswali 7',         description_en: 'Get a 7-question streak' },
  { id: 'streak_30',     emoji: '⚡', unlocked: false, title: 'Mfululizo 30',     title_en: 'Streak 30',         description: 'Pata mfululizo wa siku 30',           description_en: 'Maintain a 30-day play streak' },
  { id: 'perfect_round', emoji: '⭐', unlocked: false, title: 'Raundi Kamili',    title_en: 'Perfect Round',     description: 'Jibu maswali yote 10 kwa usahihi',    description_en: 'Answer all 10 questions correctly' },
  { id: 'perfect_5',     emoji: '🌟', unlocked: false, title: 'Raundi 5 Kamili',  title_en: '5 Perfect Rounds',  description: 'Pata raundi kamili 5',                description_en: 'Complete 5 perfect rounds' },
  { id: 'accuracy_80',   emoji: '🎯', unlocked: false, title: 'Usahihi 80%',      title_en: '80% Accuracy',      description: 'Fikia usahihi wa 80% kwa jumla',      description_en: 'Reach 80% overall accuracy' },
  { id: 'accuracy_90',   emoji: '💎', unlocked: false, title: 'Usahihi 90%',      title_en: '90% Accuracy',      description: 'Fikia usahihi wa 90% kwa jumla',      description_en: 'Reach 90% overall accuracy' },
  { id: 'daily_7',       emoji: '📅', unlocked: false, title: 'Wiki ya Kila Siku', title_en: 'Daily Week',        description: 'Cheza changamoto ya kila siku kwa wiki', description_en: 'Complete daily challenge 7 days in a row' },
  { id: 'daily_30',      emoji: '🗓️', unlocked: false, title: 'Mwezi wa Kila Siku', title_en: 'Daily Month',     description: 'Cheza changamoto kwa siku 30 mfululizo', description_en: 'Complete daily challenge 30 days in a row' },
  { id: 'coins_100',     emoji: '🪙', unlocked: false, title: 'Sarafu 100',       title_en: '100 Coins',         description: 'Kusanya sarafu 100',                  description_en: 'Collect 100 coins' },
  { id: 'coins_500',     emoji: '💰', unlocked: false, title: 'Sarafu 500',       title_en: '500 Coins',         description: 'Kusanya sarafu 500',                  description_en: 'Collect 500 coins' },
  { id: 'all_categories',emoji: '🗺️', unlocked: false, title: 'Mtaalamu',         title_en: 'All-rounder',       description: 'Cheza katika makundi yote 10',        description_en: 'Play in all 10 categories' },
  { id: 'speed_demon',   emoji: '⚡', unlocked: false, title: 'Mwepesi',          title_en: 'Speed Demon',       description: 'Pata bonasi ya kasi mara 10',         description_en: 'Earn 10 speed bonuses' },
];

export const evaluateAchievements = (
  profile: { totalGamesPlayed: number; totalCoins: number; currentStreak: number; longestStreak: number; dailyStreak: number; totalCorrectAnswers: number; totalQuestions: number },
  history: QuizResult[],
  existing: AchievementId[]
): AchievementId[] => {
  const unlocked = new Set(existing);
  const add = (id: AchievementId) => unlocked.add(id);

  const totalGames = profile.totalGamesPlayed;
  const totalCoins = profile.totalCoins;
  const overallAccuracy = profile.totalQuestions > 0
    ? profile.totalCorrectAnswers / profile.totalQuestions
    : 0;

  if (totalGames >= 1) add('first_game');
  if (totalGames >= 10) add('games_10');
  if (totalGames >= 50) add('games_50');
  if (totalGames >= 100) add('games_100');

  if (profile.longestStreak >= 3) add('streak_3');
  if (profile.longestStreak >= 7) add('streak_7');
  if (profile.currentStreak >= 30 || profile.longestStreak >= 30) add('streak_30');

  if (totalCoins >= 100) add('coins_100');
  if (totalCoins >= 500) add('coins_500');

  if (overallAccuracy >= 0.8 && profile.totalQuestions >= 20) add('accuracy_80');
  if (overallAccuracy >= 0.9 && profile.totalQuestions >= 20) add('accuracy_90');

  if (profile.dailyStreak >= 7) add('daily_7');
  if (profile.dailyStreak >= 30) add('daily_30');

  const perfectRounds = history.filter((r) => r.correctAnswers === r.totalQuestions && r.totalQuestions >= 10).length;
  if (perfectRounds >= 1) add('perfect_round');
  if (perfectRounds >= 5) add('perfect_5');

  const playedCategories = new Set(history.filter((r) => !r.isDaily).map((r) => r.categoryId));
  if (playedCategories.size >= 10) add('all_categories');

  const speedBonusGames = history.filter((r) => r.score > r.totalQuestions * 120).length;
  if (speedBonusGames >= 10) add('speed_demon');

  return Array.from(unlocked);
};

// ── Category Mastery ──────────────────────────────────────────────────────────

export const getCategoryMastery = (history: QuizResult[]): CategoryMastery[] => {
  const nonDaily = history.filter((r) => !r.isDaily);
  const byCategory: Record<string, { correct: number; total: number; games: number }> = {};

  nonDaily.forEach((r) => {
    if (!byCategory[r.categoryId]) {
      byCategory[r.categoryId] = { correct: 0, total: 0, games: 0 };
    }
    byCategory[r.categoryId].correct += r.correctAnswers;
    byCategory[r.categoryId].total += r.totalQuestions;
    byCategory[r.categoryId].games += 1;
  });

  return categories
    .map((cat) => {
      const stats = byCategory[cat.id] ?? { correct: 0, total: 0, games: 0 };
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryName_en: cat.name_en,
        gamesPlayed: stats.games,
        correctAnswers: stats.correct,
        totalQuestions: stats.total,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        emoji: cat.emoji,
        color: cat.color,
      };
    })
    .filter((m) => m.gamesPlayed > 0)
    .sort((a, b) => b.accuracy - a.accuracy);
};
