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
  coinsEarned: number;
  maxStreak: number;
  accuracy: number;
  date: string;
  isDaily: boolean;
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
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  categoryName: string;
  date: string;
  correctAnswers: number;
}

export interface GameSettings {
  sound: boolean;
  vibration: boolean;
  language: 'sw' | 'en';
  notifications: boolean;
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
