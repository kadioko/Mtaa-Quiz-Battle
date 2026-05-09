/**
 * Unit tests – leaderboard storage & filtering (src/storage/storage.ts)
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
import type { LeaderboardEntry } from '../src/types';

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage> & {
  __store: Record<string, string>;
  __reset: () => void;
};

const makeEntry = (overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry => ({
  id: `e_${Math.random()}`,
  username: 'Tester',
  score: 500,
  categoryName: 'Bongo Fleva',
  date: new Date().toISOString(),
  correctAnswers: 7,
  isDaily: false,
  ...overrides,
});

beforeEach(() => {
  mockStorage.__reset();
  jest.clearAllMocks();
});

describe('StorageService.getLeaderboard', () => {
  test('returns empty array when nothing stored', async () => {
    const lb = await StorageService.getLeaderboard();
    expect(lb).toEqual([]);
  });

  test('returns entries sorted by score descending', async () => {
    const entries = [
      makeEntry({ score: 300, id: 'a' }),
      makeEntry({ score: 800, id: 'b' }),
      makeEntry({ score: 100, id: 'c' }),
    ];
    mockStorage.__store['@mtaa_leaderboard'] = JSON.stringify(entries);

    const lb = await StorageService.getLeaderboard();
    expect(lb[0].score).toBe(800);
    expect(lb[1].score).toBe(300);
    expect(lb[2].score).toBe(100);
  });

  test('caps stored entries at 50', async () => {
    const entries = Array.from({ length: 60 }, (_, i) => makeEntry({ score: i, id: `e${i}` }));
    mockStorage.__store['@mtaa_leaderboard'] = JSON.stringify(entries);

    const lb = await StorageService.getLeaderboard();
    expect(lb).toHaveLength(50);
  });

  test('filters out entries with invalid score', async () => {
    const entries = [
      makeEntry({ score: 400, id: 'good' }),
      { id: 'bad', username: 'X', score: 'not-a-number' as any, categoryName: 'X', date: '', correctAnswers: 0 },
    ];
    mockStorage.__store['@mtaa_leaderboard'] = JSON.stringify(entries);

    const lb = await StorageService.getLeaderboard();
    expect(lb.every((e) => typeof e.score === 'number')).toBe(true);
    expect(lb).toHaveLength(1);
    expect(lb[0].id).toBe('good');
  });
});

describe('StorageService.addLeaderboardEntry', () => {
  test('adds a new entry and re-sorts', async () => {
    const existing = [makeEntry({ score: 500, id: 'old' })];
    mockStorage.__store['@mtaa_leaderboard'] = JSON.stringify(existing);

    await StorageService.addLeaderboardEntry(makeEntry({ score: 900, id: 'new' }));
    const lb = await StorageService.getLeaderboard();

    expect(lb[0].id).toBe('new');
    expect(lb[0].score).toBe(900);
  });

  test('enforces 50-entry cap after add', async () => {
    const existing = Array.from({ length: 50 }, (_, i) => makeEntry({ score: 200 + i, id: `e${i}` }));
    mockStorage.__store['@mtaa_leaderboard'] = JSON.stringify(existing);

    await StorageService.addLeaderboardEntry(makeEntry({ score: 9999, id: 'top' }));
    const lb = await StorageService.getLeaderboard();

    expect(lb).toHaveLength(50);
    expect(lb[0].id).toBe('top');
  });

  test('daily entries are preserved with isDaily flag', async () => {
    await StorageService.addLeaderboardEntry(makeEntry({ id: 'daily1', isDaily: true, score: 700 }));
    const lb = await StorageService.getLeaderboard();
    const daily = lb.find((e) => e.id === 'daily1');
    expect(daily?.isDaily).toBe(true);
  });
});

describe('Leaderboard client-side filters (slice logic)', () => {
  const entries: LeaderboardEntry[] = [
    makeEntry({ id: 'a', isDaily: false, score: 900, categoryName: 'Bongo Fleva' }),
    makeEntry({ id: 'b', isDaily: true,  score: 800, categoryName: 'Daily Challenge' }),
    makeEntry({ id: 'c', isDaily: false, score: 700, categoryName: 'Historia ya Tanzania' }),
    makeEntry({ id: 'd', isDaily: true,  score: 600, categoryName: 'Daily Challenge' }),
  ];

  test('filter: isDaily=false returns only category games', () => {
    const filtered = entries.filter((e) => !e.isDaily);
    expect(filtered).toHaveLength(2);
    filtered.forEach((e) => expect(e.isDaily).toBe(false));
  });

  test('filter: isDaily=true returns only daily games', () => {
    const filtered = entries.filter((e) => e.isDaily);
    expect(filtered).toHaveLength(2);
    filtered.forEach((e) => expect(e.isDaily).toBe(true));
  });

  test('best-score filter returns top entry', () => {
    const best = [...entries].sort((a, b) => b.score - a.score)[0];
    expect(best.id).toBe('a');
    expect(best.score).toBe(900);
  });

  test('filter by category name', () => {
    const filtered = entries.filter((e) => e.categoryName === 'Bongo Fleva');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('a');
  });
});
