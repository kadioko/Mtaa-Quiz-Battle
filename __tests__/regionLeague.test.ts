import type { CloudLeaderboardEntry } from '../src/types';
import { buildRegionalStandings, getRegionalRank, getWeekStartIso } from '../src/utils/regionLeague';

const entry = (overrides: Partial<CloudLeaderboardEntry>): CloudLeaderboardEntry => ({
  id: 'entry',
  userId: 'player-1',
  displayName: 'Mchezaji',
  score: 100,
  categoryName: 'Historia',
  correctAnswers: 5,
  totalQuestions: 10,
  isDaily: false,
  region: 'mwanza',
  createdAt: '2026-08-17T12:00:00.000Z',
  ...overrides,
});

describe('regional league', () => {
  test('starts each league week on Monday at UTC midnight', () => {
    expect(getWeekStartIso(new Date('2026-08-19T18:00:00.000Z'))).toBe('2026-08-17T00:00:00.000Z');
    expect(getWeekStartIso(new Date('2026-08-17T23:59:59.000Z'))).toBe('2026-08-17T00:00:00.000Z');
  });

  test('aggregates scores, counts unique players, and ranks regions', () => {
    const standings = buildRegionalStandings([
      entry({ id: 'mwanza-1', score: 400, userId: 'a' }),
      entry({ id: 'mwanza-2', score: 250, userId: 'a' }),
      entry({ id: 'dar-1', score: 700, userId: 'b', region: 'dar' }),
      entry({ id: 'dar-2', score: 100, userId: 'c', region: 'dar' }),
    ]);

    expect(standings.map((standing) => standing.regionId)).toEqual(['dar', 'mwanza']);
    expect(standings[0]).toMatchObject({ total: 800, players: 2, entries: 2 });
    expect(standings[1]).toMatchObject({ total: 650, players: 1, entries: 2 });
    expect(getRegionalRank(standings, 'mwanza')).toBe(2);
  });

  test('filters out results from before a weekly season', () => {
    const standings = buildRegionalStandings([
      entry({ id: 'old', score: 900, createdAt: '2026-08-16T23:59:59.000Z' }),
      entry({ id: 'current', score: 100, createdAt: '2026-08-17T00:00:00.000Z' }),
      entry({ id: 'malformed', score: 5000, createdAt: 'not-a-date' }),
    ], '2026-08-17T00:00:00.000Z');

    expect(standings).toHaveLength(1);
    expect(standings[0].total).toBe(100);
    expect(getRegionalRank(standings, 'arusha')).toBeNull();
  });
});
