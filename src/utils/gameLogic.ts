import { Question, QuizResult, QuizReviewItem } from '../types';

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
