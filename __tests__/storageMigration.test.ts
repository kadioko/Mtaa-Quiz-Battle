/**
 * Unit tests – storage migration / defaults (src/storage/storage.ts)
 *
 * Verifies that StorageService.getUserProfile() correctly merges stored partial
 * data with DEFAULT_PROFILE, so older saves from before new fields were added
 * never produce undefined values.
 *
 * Uses a manual mock of @react-native-async-storage/async-storage (Node env).
 */

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    multiRemove: jest.fn(() => Promise.resolve()),
    __store: store,
    __reset: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../src/storage/storage';

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage> & {
  __store: Record<string, string>;
  __reset: () => void;
};

beforeEach(() => {
  mockStorage.__reset();
  jest.clearAllMocks();
});

describe('StorageService.getUserProfile – migration / defaults', () => {
  test('returns full default profile when storage is empty', async () => {
    const p = await StorageService.getUserProfile();
    expect(p.username).toBe('Mchezaji');
    expect(p.totalGamesPlayed).toBe(0);
    expect(p.totalCoins).toBe(0);
    expect(p.dailyStreak).toBe(0);
    expect(p.avatar).toBe('🇹🇿');
    expect(p.dailyCompleted).toBe(false);
  });

  test('merges stored partial profile with defaults (migration)', async () => {
    // Simulate an old save that only has username + totalCoins (missing new fields)
    const oldSave = { username: 'Hadithi', totalCoins: 300 };
    mockStorage.__store['@mtaa_user_profile'] = JSON.stringify(oldSave);

    const p = await StorageService.getUserProfile();
    expect(p.username).toBe('Hadithi');
    expect(p.totalCoins).toBe(300);
    // New fields should fall back to defaults
    expect(p.dailyStreak).toBe(0);
    expect(p.longestStreak).toBe(0);
    expect(p.avatar).toBe('🇹🇿');
  });

  test('resets dailyCompleted when lastDailyDate is not today', async () => {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const stale = { username: 'X', dailyCompleted: true, lastDailyDate: yesterday };
    mockStorage.__store['@mtaa_user_profile'] = JSON.stringify(stale);

    const p = await StorageService.getUserProfile();
    expect(p.dailyCompleted).toBe(false);
  });

  test('keeps dailyCompleted true when lastDailyDate is today', async () => {
    const today = new Date().toDateString();
    const fresh = { username: 'X', dailyCompleted: true, lastDailyDate: today };
    mockStorage.__store['@mtaa_user_profile'] = JSON.stringify(fresh);

    const p = await StorageService.getUserProfile();
    expect(p.dailyCompleted).toBe(true);
  });

  test('handles corrupted JSON gracefully by returning defaults', async () => {
    mockStorage.__store['@mtaa_user_profile'] = '{ bad json !!';
    const p = await StorageService.getUserProfile();
    expect(p.username).toBe('Mchezaji');
  });
});

describe('StorageService – settings defaults', () => {
  test('returns full default settings when empty', async () => {
    const s = await StorageService.getSettings();
    expect(s.language).toBe('sw');
    expect(s.sound).toBe(true);
    expect(s.themeMode).toBe('dark');
  });

  test('merges partial saved settings', async () => {
    mockStorage.__store['@mtaa_settings'] = JSON.stringify({ language: 'en', sound: false });
    const s = await StorageService.getSettings();
    expect(s.language).toBe('en');
    expect(s.sound).toBe(false);
    expect(s.vibration).toBe(true); // default preserved
    expect(s.themeMode).toBe('dark'); // default preserved
  });
});

describe('StorageService – quiz history', () => {
  test('returns empty array when no history', async () => {
    const h = await StorageService.getQuizHistory();
    expect(h).toEqual([]);
  });

  test('addQuizResult prepends and caps at 100', async () => {
    // Fill 100 results
    const existing = Array.from({ length: 100 }, (_, i) => ({
      id: `result_${i}`, score: i,
    }));
    mockStorage.__store['@mtaa_quiz_history'] = JSON.stringify(existing);

    await StorageService.addQuizResult({ id: 'result_new', score: 999 } as any);
    const history = await StorageService.getQuizHistory();

    expect(history).toHaveLength(100);
    expect(history[0].id).toBe('result_new'); // newest first
  });
});

describe('StorageService – achievements', () => {
  test('returns empty array when no achievements stored', async () => {
    const ids = await StorageService.getUnlockedAchievements();
    expect(ids).toEqual([]);
  });

  test('saveUnlockedAchievements persists and retrieves correctly', async () => {
    await StorageService.saveUnlockedAchievements(['first_game', 'coins_100'] as any);
    const ids = await StorageService.getUnlockedAchievements();
    expect(ids).toContain('first_game');
    expect(ids).toContain('coins_100');
  });
});
