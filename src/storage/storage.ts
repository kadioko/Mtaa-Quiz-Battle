import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  LeaderboardEntry,
  GameSettings,
  QuizResult,
  DailyReward,
  AchievementId,
  SprintResult,
  StreakFreeze,
  VersusResult,
} from '../types';
import { evaluateAchievements } from '../utils/gameLogic';

const KEYS = {
  USER_PROFILE: '@mtaa_user_profile',
  LEADERBOARD: '@mtaa_leaderboard',
  SETTINGS: '@mtaa_settings',
  QUIZ_HISTORY: '@mtaa_quiz_history',
  DAILY_REWARD: '@mtaa_daily_reward',
  CATEGORY_STATS: '@mtaa_category_stats',
  ACHIEVEMENTS: '@mtaa_achievements',
  SPRINT_HISTORY: '@mtaa_sprint_history',
  STREAK_FREEZE: '@mtaa_streak_freeze',
  HINTS_USED: '@mtaa_hints_used',
  VERSUS_HISTORY: '@mtaa_versus_history',
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
  music: true,
  vibration: true,
  language: 'sw',
  notifications: true,
  themeMode: 'dark',
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
      return Array.isArray(leaderboard)
        ? leaderboard
            .filter((entry) => entry && typeof entry.score === 'number')
            .sort((a, b) => b.score - a.score)
            .slice(0, 50)
        : [];
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

  async getUnlockedAchievements(): Promise<AchievementId[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ACHIEVEMENTS);
      const list = parseStoredValue<AchievementId[]>(data, []);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  async saveUnlockedAchievements(ids: AchievementId[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(ids));
  },

  async resetAllData(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },

  // ── Sprint History ─────────────────────────────────────────────────────────
  async getSprintHistory(): Promise<SprintResult[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SPRINT_HISTORY);
      const history = parseStoredValue<SprintResult[]>(data, []);
      return Array.isArray(history) ? history : [];
    } catch {
      return [];
    }
  },

  async addSprintResult(result: SprintResult): Promise<void> {
    const existing = await StorageService.getSprintHistory();
    const updated = [result, ...existing].slice(0, 50);
    await AsyncStorage.setItem(KEYS.SPRINT_HISTORY, JSON.stringify(updated));
  },

  // ── Streak Freeze ──────────────────────────────────────────────────────────
  async getStreakFreeze(): Promise<StreakFreeze> {
    try {
      const data = await AsyncStorage.getItem(KEYS.STREAK_FREEZE);
      return parseStoredValue<StreakFreeze>(data, { count: 0, lastPurchasedDate: '' });
    } catch {
      return { count: 0, lastPurchasedDate: '' };
    }
  },

  async saveStreakFreeze(freeze: StreakFreeze): Promise<void> {
    await AsyncStorage.setItem(KEYS.STREAK_FREEZE, JSON.stringify(freeze));
  },

  async purchaseStreakFreeze(coinCost: number): Promise<{ success: boolean; coinsLeft: number }> {
    const profile = await StorageService.getUserProfile();
    if (profile.totalCoins < coinCost) return { success: false, coinsLeft: profile.totalCoins };
    const freeze = await StorageService.getStreakFreeze();
    const updated = { count: freeze.count + 1, lastPurchasedDate: new Date().toISOString() };
    await StorageService.saveStreakFreeze(updated);
    const updatedProfile = { ...profile, totalCoins: profile.totalCoins - coinCost };
    await StorageService.saveUserProfile(updatedProfile);
    return { success: true, coinsLeft: updatedProfile.totalCoins };
  },

  async useStreakFreeze(): Promise<boolean> {
    const freeze = await StorageService.getStreakFreeze();
    if (freeze.count <= 0) return false;
    const updated = { ...freeze, count: freeze.count - 1 };
    await StorageService.saveStreakFreeze(updated);
    return true;
  },

  // ── Hints Used ─────────────────────────────────────────────────────────────
  async getHintsUsed(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(KEYS.HINTS_USED);
      return parseStoredValue<number>(data, 0);
    } catch {
      return 0;
    }
  },

  async incrementHintsUsed(): Promise<number> {
    const current = await StorageService.getHintsUsed();
    const next = current + 1;
    await AsyncStorage.setItem(KEYS.HINTS_USED, JSON.stringify(next));
    return next;
  },

  // ── Versus History ─────────────────────────────────────────────────────────
  async getVersusHistory(): Promise<VersusResult[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.VERSUS_HISTORY);
      const history = parseStoredValue<VersusResult[]>(data, []);
      return Array.isArray(history) ? history : [];
    } catch {
      return [];
    }
  },

  async addVersusResult(result: VersusResult): Promise<void> {
    const existing = await StorageService.getVersusHistory();
    const updated = [result, ...existing].slice(0, 50);
    await AsyncStorage.setItem(KEYS.VERSUS_HISTORY, JSON.stringify(updated));
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
      // Try to apply streak freeze for a missed day
      const freeze = await StorageService.getStreakFreeze();
      if (freeze.count > 0 && profile.currentStreak > 0) {
        await StorageService.saveStreakFreeze({ ...freeze, count: freeze.count - 1 });
        newStreak = profile.currentStreak + 1;
      } else {
        newStreak = 1;
      }
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

    const history = await StorageService.getQuizHistory();
    const existingAchievements = await StorageService.getUnlockedAchievements();
    const newAchievements = evaluateAchievements(updatedProfile, [result, ...history], existingAchievements);
    if (newAchievements.length !== existingAchievements.length) {
      await StorageService.saveUnlockedAchievements(newAchievements);
    }

    return updatedProfile;
  },
};
