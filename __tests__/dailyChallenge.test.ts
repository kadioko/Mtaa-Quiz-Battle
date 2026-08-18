/**
 * Unit tests – getDailyQuestions (src/data/questions.ts)
 *
 * Key contracts:
 *  1. Returns exactly `count` questions
 *  2. Same date → same question set (deterministic / seeded)
 *  3. Different dates → different question sets
 *  4. Questions come from at least 5 distinct categories
 *  5. No duplicate question IDs in a single daily set
 */
import { getDailyQuestions } from '../src/data/questions';

const DAILY_COUNT = 10;

describe('getDailyQuestions', () => {
  test('returns exactly 10 questions by default', () => {
    const qs = getDailyQuestions(DAILY_COUNT);
    expect(qs).toHaveLength(DAILY_COUNT);
  });

  test('is deterministic: same date always returns same IDs', () => {
    const date = new Date('2025-01-15');
    const set1 = getDailyQuestions(DAILY_COUNT, date).map((q) => q.id);
    const set2 = getDailyQuestions(DAILY_COUNT, date).map((q) => q.id);
    expect(set1).toEqual(set2);
  });

  test('uses the UTC calendar day for a cross-device daily set', () => {
    const utcMoment = new Date('2025-01-15T00:30:00.000Z');
    const sameUtcDay = new Date('2025-01-15T23:30:00.000Z');

    expect(getDailyQuestions(DAILY_COUNT, utcMoment).map((q) => q.id))
      .toEqual(getDailyQuestions(DAILY_COUNT, sameUtcDay).map((q) => q.id));
  });

  test('different dates produce different question sets', () => {
    const d1 = new Date('2025-01-15');
    const d2 = new Date('2025-01-16');
    const ids1 = getDailyQuestions(DAILY_COUNT, d1).map((q) => q.id);
    const ids2 = getDailyQuestions(DAILY_COUNT, d2).map((q) => q.id);
    expect(ids1).not.toEqual(ids2);
  });

  test('no duplicate question IDs within a single daily set', () => {
    const qs = getDailyQuestions(DAILY_COUNT);
    const ids = qs.map((q) => q.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  test('covers at least 5 distinct categories', () => {
    const qs = getDailyQuestions(DAILY_COUNT);
    const categories = new Set(qs.map((q) => q.category));
    expect(categories.size).toBeGreaterThanOrEqual(5);
  });

  test('all returned questions have required fields', () => {
    const qs = getDailyQuestions(DAILY_COUNT);
    qs.forEach((q) => {
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('question');
      expect(q).toHaveProperty('answer');
      expect(q).toHaveProperty('options');
      expect(q).toHaveProperty('difficulty');
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options).toHaveLength(4);
    });
  });

  test('answer is always in the options array', () => {
    const qs = getDailyQuestions(DAILY_COUNT);
    qs.forEach((q) => {
      expect(q.options).toContain(q.answer);
    });
  });

  test('respects custom count parameter', () => {
    expect(getDailyQuestions(5)).toHaveLength(5);
    expect(getDailyQuestions(3)).toHaveLength(3);
  });

  test('different seed dates across a full month all produce unique sets', () => {
    const sets = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(2025, 0, i + 1);
      return getDailyQuestions(DAILY_COUNT, d)
        .map((q) => q.id)
        .join(',');
    });
    const unique = new Set(sets);
    // All 30 days should give distinct combinations
    expect(unique.size).toBe(30);
  });
});
