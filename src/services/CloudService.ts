/**
 * CloudService — Supabase REST-based client.
 *
 * Uses plain fetch; no native Supabase SDK required.
 * All calls are no-ops / return graceful fallbacks when:
 *   - SUPABASE_URL / SUPABASE_ANON_KEY env vars are missing, or
 *   - The device is offline.
 *
 * ── Environment ──────────────────────────────────────────────────────────────
 * Set these in a .env file at project root (and in EAS secrets for builds):
 *   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 *
 * ── Supabase Tables Required ─────────────────────────────────────────────────
 * See docs/CLOUD_SETUP.md for the full DDL.
 *
 * leaderboard_entries (id, user_id, display_name, score, category_name,
 *   category_name_en, correct_answers, total_questions, is_daily, created_at)
 *
 * user_syncs (id, user_id, display_name, profile_json, achievements_json,
 *   quiz_history_json, updated_at)
 *
 * push_tokens (id, user_id, token, platform, created_at, updated_at)
 */
import { Platform } from 'react-native';
import { StorageService } from '../storage/storage';
import {
  CloudUser,
  CloudLeaderboardEntry,
  CloudChallenge,
  CloudEvent,
  ChallengeAttempt,
  SyncPayload,
  UserProfile,
  AchievementId,
  QuizResult,
} from '../types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const isConfigured = () => Boolean(SUPABASE_URL && ANON_KEY);

// ── Helpers ──────────────────────────────────────────────────────────────────

function restHeaders(accessToken?: string) {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: ANON_KEY,
    Prefer: 'return=representation',
  };
  if (accessToken) h['Authorization'] = `Bearer ${accessToken}`;
  else h['Authorization'] = `Bearer ${ANON_KEY}`;
  return h;
}

async function supaFetch<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<T | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers: { ...restHeaders(accessToken), ...(options.headers as Record<string, string> ?? {}) },
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}

async function supaAuthFetch<T>(path: string, body: object): Promise<T | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Generate a random UUID-like anonymous ID
function generateAnonId(): string {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `anon-${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

// ── Supabase auth response shapes ────────────────────────────────────────────

interface SupaSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email?: string };
}

// ── CloudService ─────────────────────────────────────────────────────────────

export const CloudService = {
  /** Whether the cloud backend is configured */
  isAvailable: isConfigured,

  // ── Identity ─────────────────────────────────────────────────────────────

  /**
   * Get or create an anonymous cloud user.
   * Persists the ID locally so the same user ID survives reinstalls if backup is on.
   */
  async getOrCreateAnonUser(displayName: string): Promise<CloudUser> {
    const existing = await StorageService.getCloudUser();
    if (existing) return existing;

    const id = generateAnonId();
    const user: CloudUser = { id, displayName, isAnonymous: true };
    await StorageService.saveCloudUser(user);
    return user;
  },

  /**
   * Send a magic-link email for sign-in.
   * Returns true if the email was accepted.
   */
  async requestMagicLink(email: string): Promise<boolean> {
    if (!isConfigured()) return false;
    const result = await supaAuthFetch('magiclink', { email });
    return result !== null;
  },

  /**
   * Exchange OTP token (from magic link deep-link) for a session.
   * Call this in the URL handler for mtaaquiz://auth?token=xxx&type=magiclink
   */
  async exchangeToken(token: string, type: 'magiclink' | 'recovery' = 'magiclink'): Promise<CloudUser | null> {
    const session = await supaAuthFetch<SupaSession>('verify', { token, type });
    if (!session?.access_token) return null;

    const existing = await StorageService.getCloudUser();
    const user: CloudUser = {
      id: session.user.id,
      email: session.user.email,
      displayName: existing?.displayName ?? session.user.email ?? 'Player',
      isAnonymous: false,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: Date.now() + session.expires_in * 1000,
    };
    await StorageService.saveCloudUser(user);
    return user;
  },

  /**
   * Refresh an expired access token.
   */
  async refreshSession(refreshToken: string): Promise<CloudUser | null> {
    const session = await supaAuthFetch<SupaSession>('token?grant_type=refresh_token', {
      refresh_token: refreshToken,
    });
    if (!session?.access_token) return null;

    const existing = await StorageService.getCloudUser();
    if (!existing) return null;
    const updated: CloudUser = {
      ...existing,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: Date.now() + session.expires_in * 1000,
    };
    await StorageService.saveCloudUser(updated);
    return updated;
  },

  /**
   * Get a valid access token, refreshing if needed.
   * Returns undefined for anonymous users (uses anon key).
   */
  async getValidToken(): Promise<string | undefined> {
    const user = await StorageService.getCloudUser();
    if (!user || user.isAnonymous) return undefined;
    if (!user.accessToken) return undefined;
    if (user.expiresAt && user.expiresAt < Date.now() + 60_000) {
      if (user.refreshToken) {
        const refreshed = await CloudService.refreshSession(user.refreshToken);
        return refreshed?.accessToken;
      }
      return undefined;
    }
    return user.accessToken;
  },

  async signOut(): Promise<void> {
    await StorageService.clearCloudUser();
  },

  // ── Leaderboard ───────────────────────────────────────────────────────────

  /**
   * Submit a score to the cloud leaderboard.
   */
  async submitScore(entry: {
    displayName: string;
    score: number;
    categoryName: string;
    categoryName_en?: string;
    correctAnswers: number;
    totalQuestions: number;
    isDaily: boolean;
    region?: string;
  }): Promise<boolean> {
    if (!isConfigured()) return false;
    const user = await StorageService.getCloudUser() ?? await CloudService.getOrCreateAnonUser(entry.displayName);
    const token = await CloudService.getValidToken();
    // Default the region from the local profile if not provided
    const region = entry.region ?? (await StorageService.getUserProfile()).region;

    const result = await supaFetch(
      'leaderboard_entries',
      {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          display_name: entry.displayName,
          score: entry.score,
          category_name: entry.categoryName,
          category_name_en: entry.categoryName_en,
          correct_answers: entry.correctAnswers,
          total_questions: entry.totalQuestions,
          is_daily: entry.isDaily,
          region: region ?? null,
        }),
      },
      token
    );
    return result !== null;
  },

  /**
   * Fetch global top scores, optionally filtered by category or daily-only.
   */
  async fetchLeaderboard(opts: {
    limit?: number;
    categoryName?: string;
    dailyOnly?: boolean;
    createdAfter?: string;
  } = {}): Promise<CloudLeaderboardEntry[]> {
    if (!isConfigured()) return [];
    const { limit = 50, categoryName, dailyOnly, createdAfter } = opts;
    let query = `leaderboard_entries?select=*&order=score.desc&limit=${limit}`;
    if (categoryName) query += `&category_name=eq.${encodeURIComponent(categoryName)}`;
    if (dailyOnly) query += `&is_daily=eq.true`;
    if (createdAfter) query += `&created_at=gte.${encodeURIComponent(createdAfter)}`;

    const token = await CloudService.getValidToken();
    const rows = await supaFetch<Record<string, unknown>[]>(query, { method: 'GET' }, token);
    if (!rows || !Array.isArray(rows)) return [];

    return rows.map((r) => ({
      id: String(r.id),
      userId: String(r.user_id),
      displayName: String(r.display_name ?? 'Anon'),
      score: Number(r.score),
      categoryName: String(r.category_name ?? ''),
      categoryName_en: r.category_name_en ? String(r.category_name_en) : undefined,
      correctAnswers: Number(r.correct_answers ?? 0),
      totalQuestions: Number(r.total_questions ?? 10),
      isDaily: Boolean(r.is_daily),
      region: r.region ? String(r.region) : undefined,
      createdAt: String(r.created_at ?? ''),
    }));
  },

  // ── Progress Sync ─────────────────────────────────────────────────────────

  /**
   * Push local progress to the cloud. Overwrites server copy.
   */
  async syncPush(): Promise<boolean> {
    if (!isConfigured()) return false;
    const user = await StorageService.getCloudUser();
    if (!user) return false;
    const token = await CloudService.getValidToken();

    const [profile, achievements, quizHistory] = await Promise.all([
      StorageService.getUserProfile(),
      StorageService.getUnlockedAchievements(),
      StorageService.getQuizHistory(),
    ]);

    const payload: SyncPayload = {
      profile,
      achievements,
      quizHistory: quizHistory.slice(0, 50),
      lastSyncedAt: new Date().toISOString(),
    };

    const result = await supaFetch(
      'user_syncs',
      {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({
          user_id: user.id,
          display_name: user.displayName,
          profile_json: JSON.stringify(profile),
          achievements_json: JSON.stringify(achievements),
          quiz_history_json: JSON.stringify(payload.quizHistory),
          updated_at: payload.lastSyncedAt,
        }),
      },
      token
    );

    if (result !== null) {
      await StorageService.saveLastSync(payload.lastSyncedAt);
    }
    return result !== null;
  },

  /**
   * Pull server copy and merge into local storage (server wins for profile stats,
   * local wins for achievements that were earned locally).
   */
  async syncPull(): Promise<boolean> {
    if (!isConfigured()) return false;
    const user = await StorageService.getCloudUser();
    if (!user) return false;
    const token = await CloudService.getValidToken();

    const rows = await supaFetch<Record<string, unknown>[]>(
      `user_syncs?user_id=eq.${user.id}&select=*&limit=1`,
      { method: 'GET' },
      token
    );
    if (!rows || rows.length === 0) return false;

    const row = rows[0];
    try {
      const remoteProfile: UserProfile = JSON.parse(String(row.profile_json ?? '{}'));
      const remoteAchievements: AchievementId[] = JSON.parse(String(row.achievements_json ?? '[]'));
      const remoteHistory: QuizResult[] = JSON.parse(String(row.quiz_history_json ?? '[]'));

      const localProfile = await StorageService.getUserProfile();
      const localAchievements = await StorageService.getUnlockedAchievements();
      const localHistory = await StorageService.getQuizHistory();

      // Merge: take max values for numeric stats
      const merged: UserProfile = {
        ...localProfile,
        totalGamesPlayed: Math.max(localProfile.totalGamesPlayed, remoteProfile.totalGamesPlayed ?? 0),
        bestScore: Math.max(localProfile.bestScore, remoteProfile.bestScore ?? 0),
        totalCoins: Math.max(localProfile.totalCoins, remoteProfile.totalCoins ?? 0),
        longestStreak: Math.max(localProfile.longestStreak, remoteProfile.longestStreak ?? 0),
        totalCorrectAnswers: Math.max(localProfile.totalCorrectAnswers, remoteProfile.totalCorrectAnswers ?? 0),
        totalQuestions: Math.max(localProfile.totalQuestions, remoteProfile.totalQuestions ?? 0),
      };

      // Merge achievements (union)
      const mergedAchievements = Array.from(new Set([...localAchievements, ...remoteAchievements]));

      // Merge history (deduplicate by id, keep 100 most recent)
      const historyMap = new Map<string, QuizResult>();
      [...localHistory, ...remoteHistory].forEach((r) => { if (r.id) historyMap.set(r.id, r); });
      const mergedHistory = Array.from(historyMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 100);

      await Promise.all([
        StorageService.saveUserProfile(merged),
        StorageService.saveUnlockedAchievements(mergedAchievements as AchievementId[]),
        AsyncStorage.setItem('@mtaa_quiz_history', JSON.stringify(mergedHistory)),
      ]);

      await StorageService.saveLastSync(new Date().toISOString());
      return true;
    } catch {
      return false;
    }
  },

  // ── Push Tokens ───────────────────────────────────────────────────────────

  /**
   * Register an Expo Push Token with the server so server-side blasts work.
   */
  async registerPushToken(token: string): Promise<boolean> {
    if (!isConfigured()) return false;
    const user = await StorageService.getCloudUser() ?? await CloudService.getOrCreateAnonUser('Player');
    const accessToken = await CloudService.getValidToken();
    const platform = Platform.OS;

    const result = await supaFetch(
      'push_tokens',
      {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({
          user_id: user.id,
          token,
          platform,
          updated_at: new Date().toISOString(),
        }),
      },
      accessToken
    );
    return result !== null;
  },

  // ── Challenges (cross-device async multiplayer) ───────────────────────────
  //
  // Tables required (see docs/CLOUD_SETUP.md):
  //   challenges (id, code, creator_name, category_id, category_name,
  //     question_ids, created_at)
  //   challenge_attempts (id, code, user_id, player_name, score,
  //     correct_answers, total_questions, created_at)

  /**
   * Create a challenge: stores the exact question set under a short shareable
   * code. Returns the code, or null on failure.
   */
  async createChallenge(input: {
    creatorName: string;
    categoryId: string;
    categoryName: string;
    questionIds: string[];
  }): Promise<string | null> {
    if (!isConfigured()) return null;
    const token = await CloudService.getValidToken();
    // 6-char code without ambiguous characters (0/O, 1/I/L)
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 6 }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join('');

    const result = await supaFetch(
      'challenges',
      {
        method: 'POST',
        body: JSON.stringify({
          code,
          creator_name: input.creatorName,
          category_id: input.categoryId,
          category_name: input.categoryName,
          question_ids: JSON.stringify(input.questionIds),
        }),
      },
      token
    );
    return result !== null ? code : null;
  },

  /** Look up a challenge by its share code. */
  async fetchChallenge(code: string): Promise<CloudChallenge | null> {
    if (!isConfigured()) return null;
    const token = await CloudService.getValidToken();
    const rows = await supaFetch<Record<string, unknown>[]>(
      `challenges?code=eq.${encodeURIComponent(code.trim().toUpperCase())}&select=*&limit=1`,
      { method: 'GET' },
      token
    );
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    let questionIds: string[] = [];
    try {
      const parsed = JSON.parse(String(r.question_ids ?? '[]'));
      if (Array.isArray(parsed)) questionIds = parsed.map(String);
    } catch {}
    return {
      id: String(r.id),
      code: String(r.code),
      creatorName: String(r.creator_name ?? 'Player'),
      categoryId: String(r.category_id ?? ''),
      categoryName: String(r.category_name ?? ''),
      questionIds,
      createdAt: String(r.created_at ?? ''),
    };
  },

  /** Submit a player's result for a challenge. */
  async submitChallengeAttempt(input: {
    code: string;
    playerName: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
  }): Promise<boolean> {
    if (!isConfigured()) return false;
    const user = await StorageService.getCloudUser() ?? await CloudService.getOrCreateAnonUser(input.playerName);
    const token = await CloudService.getValidToken();
    const result = await supaFetch(
      'challenge_attempts',
      {
        method: 'POST',
        body: JSON.stringify({
          code: input.code.trim().toUpperCase(),
          user_id: user.id,
          player_name: input.playerName,
          score: input.score,
          correct_answers: input.correctAnswers,
          total_questions: input.totalQuestions,
        }),
      },
      token
    );
    return result !== null;
  },

  // ── Live Events ───────────────────────────────────────────────────────────

  /**
   * Fetch the currently running live event, if any.
   * Table: events (id, name, name_en, emoji, seed, starts_at, ends_at)
   */
  async fetchActiveEvent(): Promise<CloudEvent | null> {
    if (!isConfigured()) return null;
    const now = encodeURIComponent(new Date().toISOString());
    const token = await CloudService.getValidToken();
    const rows = await supaFetch<Record<string, unknown>[]>(
      `events?starts_at=lte.${now}&ends_at=gte.${now}&select=*&order=starts_at.desc&limit=1`,
      { method: 'GET' },
      token
    );
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      id: String(r.id),
      name: String(r.name ?? 'Event'),
      name_en: String(r.name_en ?? r.name ?? 'Event'),
      emoji: String(r.emoji ?? '🔥'),
      seed: String(r.seed ?? r.id),
      startsAt: String(r.starts_at ?? ''),
      endsAt: String(r.ends_at ?? ''),
    };
  },

  // ── Remote Question Packs ─────────────────────────────────────────────────

  /**
   * Fetch all questions from active packs.
   * Returns null when not configured / offline (caller keeps its cache).
   * Table: question_packs (id, name, version, questions_json, active, created_at)
   */
  async fetchQuestionPacks(): Promise<unknown[] | null> {
    if (!isConfigured()) return null;
    const token = await CloudService.getValidToken();
    const rows = await supaFetch<Record<string, unknown>[]>(
      'question_packs?active=eq.true&select=questions_json&order=created_at.asc',
      { method: 'GET' },
      token
    );
    if (!rows || !Array.isArray(rows)) return null;
    const all: unknown[] = [];
    rows.forEach((r) => {
      try {
        const parsed = JSON.parse(String(r.questions_json ?? '[]'));
        if (Array.isArray(parsed)) all.push(...parsed);
      } catch {}
    });
    return all;
  },

  /** Fetch the ranked results for a challenge. */
  async fetchChallengeAttempts(code: string): Promise<ChallengeAttempt[]> {
    if (!isConfigured()) return [];
    const token = await CloudService.getValidToken();
    const rows = await supaFetch<Record<string, unknown>[]>(
      `challenge_attempts?code=eq.${encodeURIComponent(code.trim().toUpperCase())}&select=*&order=score.desc&limit=100`,
      { method: 'GET' },
      token
    );
    if (!rows || !Array.isArray(rows)) return [];
    return rows.map((r) => ({
      id: String(r.id),
      code: String(r.code),
      userId: String(r.user_id ?? ''),
      playerName: String(r.player_name ?? 'Player'),
      score: Number(r.score ?? 0),
      correctAnswers: Number(r.correct_answers ?? 0),
      totalQuestions: Number(r.total_questions ?? 10),
      createdAt: String(r.created_at ?? ''),
    }));
  },
};

// Re-export AsyncStorage reference for syncPull merge
import AsyncStorage from '@react-native-async-storage/async-storage';
