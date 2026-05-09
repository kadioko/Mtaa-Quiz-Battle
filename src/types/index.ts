export interface Question {
  id: string;
  category: string;
  question: string;
  question_en?: string;
  options: string[];
  options_en?: string[];
  answer: string;
  answer_en?: string;
  explanation: string;
  explanation_en?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sourceNote?: string;
  sourceUrl?: string;
  timeSensitive?: boolean;
  reviewAfter?: string;
  reviewReason?: string;
}

export interface Category {
  id: string;
  name: string;
  name_en: string;
  emoji: string;
  color: string;
  description: string;
  description_en: string;
  questionCount: number;
}

export interface QuizSession {
  categoryId: string;
  questions: Question[];
  currentIndex: number;
  answers: (string | null)[];
  score: number;
  streak: number;
  maxStreak: number;
  startTime: number;
  questionStartTime: number;
  timeBonus: number[];
  isDaily: boolean;
}

export interface QuizResult {
  id: string;
  categoryId: string;
  categoryName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  answerMap?: boolean[];
  reviewItems?: QuizReviewItem[];
  coinsEarned: number;
  maxStreak: number;
  accuracy: number;
  date: string;
  isDaily: boolean;
}

export interface QuizReviewItem {
  questionId: string;
  question: string;
  question_en?: string;
  category: string;
  selectedAnswer: string | null;
  selectedAnswer_en?: string | null;
  correctAnswer: string;
  correctAnswer_en?: string;
  explanation: string;
  explanation_en?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  wasCorrect: boolean;
  timedOut: boolean;
}

export interface PlayerRank {
  level: number;
  title: string;
  title_en: string;
  emoji: string;
  minCoins: number;
  color: string;
}

export type AchievementId =
  | 'first_game'
  | 'games_10' | 'games_50' | 'games_100'
  | 'streak_3' | 'streak_7' | 'streak_30'
  | 'perfect_round'
  | 'perfect_5'
  | 'accuracy_80'
  | 'accuracy_90'
  | 'daily_7'
  | 'daily_30'
  | 'coins_100'
  | 'coins_500'
  | 'all_categories'
  | 'speed_demon';

export interface Achievement {
  id: AchievementId;
  title: string;
  title_en: string;
  description: string;
  description_en: string;
  emoji: string;
  unlockedAt?: string;
  unlocked: boolean;
}

export interface CategoryMastery {
  categoryId: string;
  categoryName: string;
  categoryName_en: string;
  gamesPlayed: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  emoji: string;
  color: string;
}

export interface UserProfile {
  username: string;
  totalGamesPlayed: number;
  bestScore: number;
  totalCoins: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string;
  totalCorrectAnswers: number;
  totalQuestions: number;
  favoriteCategory: string;
  dailyStreak: number;
  lastDailyDate: string;
  dailyCompleted: boolean;
  avatar: string;
  achievements?: AchievementId[];
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  categoryName: string;
  date: string;
  correctAnswers: number;
  isDaily?: boolean;
}

export interface GameSettings {
  sound: boolean;
  music: boolean;
  vibration: boolean;
  language: 'sw' | 'en';
  notifications: boolean;
  themeMode: 'dark' | 'light';
}

export interface DailyReward {
  lastClaimedDate: string;
  consecutiveDays: number;
  totalClaimed: number;
}

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Categories: undefined;
  Quiz: { categoryId: string; isDaily?: boolean };
  Result: { result: QuizResult };
  Leaderboard: undefined;
  Profile: undefined;
  Settings: undefined;
  DailyChallenge: undefined;
};
