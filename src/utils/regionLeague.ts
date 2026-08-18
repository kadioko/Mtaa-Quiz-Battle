import { getRegionById, Region } from '../data/regions';
import { CloudLeaderboardEntry } from '../types';

export type RegionalLeaguePeriod = 'week' | 'allTime';

export interface RegionalStanding {
  regionId: string;
  region?: Region;
  total: number;
  players: number;
  entries: number;
}

/** Starts the competition week on Monday 00:00 UTC for a consistent cloud query. */
export const getWeekStartIso = (date = new Date()): string => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  return start.toISOString();
};

export const buildRegionalStandings = (
  entries: CloudLeaderboardEntry[],
  since?: string
): RegionalStanding[] => {
  const sinceTime = since ? Date.parse(since) : Number.NEGATIVE_INFINITY;
  const standings = new Map<string, { total: number; players: Set<string>; entries: number }>();

  entries.forEach((entry) => {
    const createdAt = Date.parse(entry.createdAt);
    if (!entry.region || !Number.isFinite(entry.score) || !Number.isFinite(createdAt) || createdAt < sinceTime) return;
    const bucket = standings.get(entry.region) ?? { total: 0, players: new Set<string>(), entries: 0 };
    bucket.total += entry.score;
    bucket.players.add(entry.userId || entry.displayName);
    bucket.entries += 1;
    standings.set(entry.region, bucket);
  });

  return Array.from(standings.entries())
    .map(([regionId, stats]) => ({
      regionId,
      region: getRegionById(regionId),
      total: stats.total,
      players: stats.players.size,
      entries: stats.entries,
    }))
    .sort((a, b) => b.total - a.total || b.players - a.players || a.regionId.localeCompare(b.regionId));
};

export const getRegionalRank = (standings: RegionalStanding[], regionId?: string): number | null => {
  if (!regionId) return null;
  const index = standings.findIndex((standing) => standing.regionId === regionId);
  return index >= 0 ? index + 1 : null;
};
