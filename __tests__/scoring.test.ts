/**
 * Unit tests – scoring & coin calculation (src/utils/gameLogic.ts)
 */
import {
  calculateScore,
  calculateCoins,
  buildQuizResult,
  getPlayerRank,
  getNextRank,
  evaluateAchievements,
  RANKS,
} from '../src/utils/gameLogic';

// ── calculateScore ────────────────────────────────────────────────────────────

describe('calculateScore', () => {
  const TOTAL_TIME = 15;

  test('perfect answer, no streak, easy → base + max speed bonus', () => {
    const { points, speedBonus, streakBonus } = calculateScore(15, TOTAL_TIME, 0, 'easy');
    expect(speedBonus).toBe(50); // MAX_SPEED_BONUS
    expect(streakBonus).toBe(0);
    expect(points).toBe(150); // (100 + 50 + 0) * 1
  });

  test('multiplier applied for hard difficulty', () => {
    const { points } = calculateScore(15, TOTAL_TIME, 0, 'hard');
    expect(points).toBe(300); // (100 + 50) * 2
  });

  test('streak bonus kicks in at threshold 3', () => {
    const { streakBonus } = calculateScore(15, TOTAL_TIME, 3, 'easy');
    expect(streakBonus).toBe(30); // STREAK_BONUS
  });

  test('no streak bonus below threshold', () => {
    const { streakBonus } = calculateScore(15, TOTAL_TIME, 2, 'easy');
    expect(streakBonus).toBe(0);
  });

  test('zero time left gives zero speed bonus', () => {
    const { speedBonus } = calculateScore(0, TOTAL_TIME, 0, 'easy');
    expect(speedBonus).toBe(0);
  });

  test('medium difficulty multiplier is 1.5', () => {
    const { points } = calculateScore(15, TOTAL_TIME, 0, 'medium');
    expect(points).toBe(225); // (100 + 50) * 1.5
  });

  test('half time remaining', () => {
    const { speedBonus } = calculateScore(7, TOTAL_TIME, 0, 'easy');
    // 7/15 * 50 = 23.33 → rounded
    expect(speedBonus).toBe(Math.round((7 / 15) * 50));
  });
});

// ── calculateCoins ────────────────────────────────────────────────────────────

describe('calculateCoins', () => {
  test('perfect score, all correct → base + accuracy bonus', () => {
    const coins = calculateCoins(500, 10, 10);
    expect(coins).toBe(Math.floor(500 / 50) + 10); // 10 + 10 = 20
  });

  test('80% accuracy gets +10 bonus', () => {
    const coins = calculateCoins(400, 8, 10);
    expect(coins).toBe(Math.floor(400 / 50) + 10); // 8 + 10 = 18
  });

  test('60%+ accuracy gets +5 bonus', () => {
    const coins = calculateCoins(300, 6, 10);
    expect(coins).toBe(Math.floor(300 / 50) + 5); // 6 + 5 = 11
  });

  test('below 60% accuracy gets no bonus', () => {
    const coins = calculateCoins(200, 5, 10);
    expect(coins).toBe(Math.floor(200 / 50) + 0); // 4
  });

  test('zero score gives zero coins', () => {
    expect(calculateCoins(0, 0, 10)).toBe(0);
  });
});

// ── buildQuizResult ───────────────────────────────────────────────────────────

describe('buildQuizResult', () => {
  test('accuracy is calculated as percentage', () => {
    const result = buildQuizResult('cat1', 'Test', 500, 7, 10, 3, false);
    expect(result.accuracy).toBe(70);
  });

  test('coinsEarned is populated', () => {
    const result = buildQuizResult('cat1', 'Test', 500, 10, 10, 5, false);
    expect(result.coinsEarned).toBeGreaterThan(0);
  });

  test('isDaily flag is forwarded', () => {
    const result = buildQuizResult('daily', 'Daily Challenge', 300, 5, 10, 2, true);
    expect(result.isDaily).toBe(true);
  });

  test('id follows result_<timestamp> format', () => {
    const result = buildQuizResult('c', 'C', 100, 5, 10, 1, false);
    expect(result.id).toMatch(/^result_\d+$/);
  });
});

// ── Player Ranks ──────────────────────────────────────────────────────────────

describe('getPlayerRank', () => {
  test('0 coins → level 1 (Mgeni)', () => {
    expect(getPlayerRank(0).level).toBe(1);
  });

  test('50 coins → level 2 (Mwanafunzi)', () => {
    expect(getPlayerRank(50).level).toBe(2);
  });

  test('5000 coins → level 9 (Hadithi)', () => {
    expect(getPlayerRank(5000).level).toBe(9);
  });

  test('8000 coins → max level 10 (Gwiji wa Bongo)', () => {
    expect(getPlayerRank(8000).level).toBe(10);
  });

  test('coins just below next threshold stay on current level', () => {
    expect(getPlayerRank(149).level).toBe(2); // 150 needed for level 3
  });

  test('RANKS array is sorted ascending by minCoins', () => {
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].minCoins).toBeGreaterThan(RANKS[i - 1].minCoins);
    }
  });
});

describe('getNextRank', () => {
  test('returns next rank when not at max', () => {
    const next = getNextRank(0);
    expect(next?.level).toBe(2);
  });

  test('returns null at max rank', () => {
    expect(getNextRank(8000)).toBeNull();
  });
});

// ── evaluateAchievements ──────────────────────────────────────────────────────

describe('evaluateAchievements', () => {
  const baseProfile = {
    totalGamesPlayed: 0,
    totalCoins: 0,
    currentStreak: 0,
    longestStreak: 0,
    dailyStreak: 0,
    totalCorrectAnswers: 0,
    totalQuestions: 0,
  };

  test('first_game unlocked after 1 game', () => {
    const ids = evaluateAchievements({ ...baseProfile, totalGamesPlayed: 1 }, [], []);
    expect(ids).toContain('first_game');
  });

  test('games_10 unlocked at 10 games', () => {
    const ids = evaluateAchievements({ ...baseProfile, totalGamesPlayed: 10 }, [], []);
    expect(ids).toContain('games_10');
    expect(ids).not.toContain('games_50');
  });

  test('coins_100 unlocked at 100 coins', () => {
    const ids = evaluateAchievements({ ...baseProfile, totalCoins: 100 }, [], []);
    expect(ids).toContain('coins_100');
  });

  test('accuracy_80 requires 20+ questions answered', () => {
    const noQs = evaluateAchievements(
      { ...baseProfile, totalCorrectAnswers: 9, totalQuestions: 10 }, [], []
    );
    expect(noQs).not.toContain('accuracy_80');

    const enough = evaluateAchievements(
      { ...baseProfile, totalCorrectAnswers: 18, totalQuestions: 20 }, [], []
    );
    expect(enough).toContain('accuracy_80');
  });

  test('perfect_round from history', () => {
    const history = [
      { correctAnswers: 10, totalQuestions: 10, isDaily: false, categoryId: 'c1' },
    ] as any;
    const ids = evaluateAchievements(baseProfile, history, []);
    expect(ids).toContain('perfect_round');
  });

  test('existing unlocked ids are preserved', () => {
    const ids = evaluateAchievements(baseProfile, [], ['coins_500'] as any);
    expect(ids).toContain('coins_500');
  });

  test('all_categories requires 10 distinct category ids', () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      correctAnswers: 5, totalQuestions: 10, isDaily: false, categoryId: `cat${i}`,
    })) as any;
    const ids = evaluateAchievements(baseProfile, history, []);
    expect(ids).toContain('all_categories');
  });

  test('streak_3 / streak_7 come from in-game question streaks', () => {
    const history = [
      { correctAnswers: 8, totalQuestions: 10, isDaily: false, categoryId: 'c1', maxStreak: 7 },
    ] as any;
    const ids = evaluateAchievements(baseProfile, history, []);
    expect(ids).toContain('streak_3');
    expect(ids).toContain('streak_7');
  });

  test('day streaks alone do not unlock question-streak achievements', () => {
    const ids = evaluateAchievements({ ...baseProfile, longestStreak: 7 }, [], []);
    expect(ids).not.toContain('streak_3');
    expect(ids).not.toContain('streak_7');
  });

  test('practice results do not count toward all_categories', () => {
    const history = [
      ...Array.from({ length: 9 }, (_, i) => ({
        correctAnswers: 5, totalQuestions: 10, isDaily: false, categoryId: `cat${i}`,
      })),
      { correctAnswers: 5, totalQuestions: 10, isDaily: false, categoryId: 'practice' },
    ] as any;
    const ids = evaluateAchievements(baseProfile, history, []);
    expect(ids).not.toContain('all_categories');
  });

  test('all_categories not unlocked for daily-only history', () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      correctAnswers: 5, totalQuestions: 10, isDaily: true, categoryId: `cat${i}`,
    })) as any;
    const ids = evaluateAchievements(baseProfile, history, []);
    expect(ids).not.toContain('all_categories');
  });
});
