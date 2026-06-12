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
  mode?: 'standard' | 'sprint' | 'versus';
}

export interface SprintResult {
  id: string;
  score: number;
  correctAnswers: number;
  totalAnswered: number;
  maxStreak: number;
  coinsEarned: number;
  date: string;
}

export interface StreakFreeze {
  count: number;
  lastPurchasedDate: string;
}

export interface VersusResult {
  id: string;
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  player1Correct: number;
  player2Correct: number;
  totalQuestions: number;
  categoryId: string;
  categoryName: string;
  winnerId: 'player1' | 'player2' | 'draw';
  date: string;
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
  | 'speed_demon'
  | 'sprint_debut'
  | 'sprint_50'
  | 'sprint_100'
  | 'hint_master'
  | 'versus_win'
  | 'freeze_used'
  | 'coins_1000'
  | 'games_250'
  | 'practice_perfect'
  | 'challenge_played';

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
  region?: string;
  achievements?: AchievementId[];
  cloudUserId?: string;
  cloudEmail?: string;
}

export interface CloudUser {
  id: string;
  email?: string;
  displayName: string;
  isAnonymous: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface CloudLeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  score: number;
  categoryName: string;
  categoryName_en?: string;
  correctAnswers: number;
  totalQuestions: number;
  isDaily: boolean;
  region?: string;
  createdAt: string;
}

export interface CloudEvent {
  id: string;
  name: string;
  name_en: string;
  emoji: string;
  seed: string;
  startsAt: string;
  endsAt: string;
}

export interface CloudChallenge {
  id: string;
  code: string;
  creatorName: string;
  categoryId: string;
  categoryName: string;
  questionIds: string[];
  createdAt: string;
}

export interface ChallengeAttempt {
  id: string;
  code: string;
  userId: string;
  playerName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  createdAt: string;
}

export interface SyncPayload {
  profile: UserProfile;
  achievements: AchievementId[];
  quizHistory: QuizResult[];
  lastSyncedAt: string;
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
  pushToken?: string;
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
  Sprint: undefined;
  Versus: { categoryId?: string };
  Leaderboard: undefined;
  Profile: undefined;
  Settings: undefined;
  DailyChallenge: undefined;
};
