import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  LeaderboardEntry,
  GameSettings,
  QuizResult,
  DailyReward,
} from '../types';

const KEYS = {
  USER_PROFILE: '@mtaa_user_profile',
  LEADERBOARD: '@mtaa_leaderboard',
  SETTINGS: '@mtaa_settings',
  QUIZ_HISTORY: '@mtaa_quiz_history',
  DAILY_REWARD: '@mtaa_daily_reward',
  CATEGORY_STATS: '@mtaa_category_stats',
};

const DEFAULT_PROFILE: UserProfile = {
  username: 'Mchezaji',
  totalGamesPlayed: 0,
  bestScore: 0,
  totalCoins: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedDate: '',
  totalCorrectAnswers: 0,
  totalQuestions: 0,
  favoriteCategory: '',
  dailyStreak: 0,
  lastDailyDate: '',
  dailyCompleted: false,
  avatar: '🇹🇿',
};

const DEFAULT_SETTINGS: GameSettings = {
  sound: true,
  vibration: true,
  language: 'sw',
  notifications: true,
};

const parseStoredValue = <T>(data: string | null, fallback: T): T => {
  if (!data) return fallback;
  try {
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
};

export const StorageService = {
  async getUserProfile(): Promise<UserProfile> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
      const storedProfile = parseStoredValue<Partial<UserProfile>>(data, {});
      const profile: UserProfile = { ...DEFAULT_PROFILE, ...storedProfile };
      const today = new Date().toDateString();
      if (profile.dailyCompleted && profile.lastDailyDate !== today) {
        profile.dailyCompleted = false;
        await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
      }
      return profile;
    } catch {
      return { ...DEFAULT_PROFILE };
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  async getSettings(): Promise<GameSettings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      const storedSettings = parseStoredValue<Partial<GameSettings>>(data, {});
      return { ...DEFAULT_SETTINGS, ...storedSettings };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },

  async saveSettings(settings: GameSettings): Promise<void> {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.LEADERBOARD);
      const leaderboard = parseStoredValue<LeaderboardEntry[]>(data, []);
      return Array.isArray(leaderboard) ? leaderboard : [];
    } catch {
      return [];
    }
  },

  async addLeaderboardEntry(entry: LeaderboardEntry): Promise<void> {
    const existing = await StorageService.getLeaderboard();
    const updated = [...existing, entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
    await AsyncStorage.setItem(KEYS.LEADERBOARD, JSON.stringify(updated));
  },

  async getQuizHistory(): Promise<QuizResult[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.QUIZ_HISTORY);
      const history = parseStoredValue<QuizResult[]>(data, []);
      return Array.isArray(history) ? history : [];
    } catch {
      return [];
    }
  },

  async addQuizResult(result: QuizResult): Promise<void> {
    const existing = await StorageService.getQuizHistory();
    const updated = [result, ...existing].slice(0, 100);
    await AsyncStorage.setItem(KEYS.QUIZ_HISTORY, JSON.stringify(updated));
  },

  async getDailyReward(): Promise<DailyReward> {
    try {
      const data = await AsyncStorage.getItem(KEYS.DAILY_REWARD);
      return parseStoredValue<DailyReward>(data, {
        lastClaimedDate: '',
        consecutiveDays: 0,
        totalClaimed: 0,
      });
    } catch {
      return { lastClaimedDate: '', consecutiveDays: 0, totalClaimed: 0 };
    }
  },

  async saveDailyReward(reward: DailyReward): Promise<void> {
    await AsyncStorage.setItem(KEYS.DAILY_REWARD, JSON.stringify(reward));
  },

  async getCategoryStats(): Promise<Record<string, number>> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CATEGORY_STATS);
      const stats = parseStoredValue<Record<string, number>>(data, {});
      return stats && typeof stats === 'object' && !Array.isArray(stats) ? stats : {};
    } catch {
      return {};
    }
  },

  async updateCategoryStats(categoryId: string): Promise<Record<string, number>> {
    const stats = await StorageService.getCategoryStats();
    stats[categoryId] = (stats[categoryId] || 0) + 1;
    await AsyncStorage.setItem(KEYS.CATEGORY_STATS, JSON.stringify(stats));
    return stats;
  },

  async resetAllData(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },

  async updateProfileAfterGame(result: QuizResult): Promise<UserProfile> {
    const profile = await StorageService.getUserProfile();
    const today = new Date().toDateString();
    const lastPlayed = profile.lastPlayedDate;
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    let newStreak = profile.currentStreak;
    if (lastPlayed === yesterday) {
      newStreak = profile.currentStreak + 1;
    } else if (lastPlayed !== today) {
      newStreak = 1;
    }

    const categoryStats = result.categoryId === 'daily'
      ? await StorageService.getCategoryStats()
      : await StorageService.updateCategoryStats(result.categoryId);
    const favoriteCategory = Object.entries(categoryStats)
      .filter(([categoryId]) => categoryId !== 'daily')
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? profile.favoriteCategory;

    const updatedProfile: UserProfile = {
      ...profile,
      totalGamesPlayed: profile.totalGamesPlayed + 1,
      bestScore: Math.max(profile.bestScore, result.score),
      totalCoins: profile.totalCoins + result.coinsEarned,
      currentStreak: newStreak,
      longestStreak: Math.max(profile.longestStreak, newStreak),
      lastPlayedDate: today,
      totalCorrectAnswers: profile.totalCorrectAnswers + result.correctAnswers,
      totalQuestions: profile.totalQuestions + result.totalQuestions,
      favoriteCategory,
    };

    await StorageService.saveUserProfile(updatedProfile);
    return updatedProfile;
  },
};
