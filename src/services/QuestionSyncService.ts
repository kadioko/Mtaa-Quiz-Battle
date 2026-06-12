/**
 * QuestionSyncService — remote question delivery with local cache.
 *
 * New questions can be published to the Supabase `question_packs` table and
 * reach players WITHOUT an app release:
 *   1. On app start, cached remote questions load instantly from AsyncStorage.
 *   2. A background fetch pulls active packs, validates every question,
 *      updates the cache, and merges them into the runtime question pool.
 *
 * Daily/weekly challenges deliberately ignore remote questions so the seeded
 * sets stay identical across devices (see src/data/questions.ts).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Question } from '../types';
import { setRemoteQuestions } from '../data/questions';
import { CloudService } from './CloudService';

const CACHE_KEY = '@mtaa_remote_questions';

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

/** Strict shape validation — a bad remote question must never crash the quiz. */
export const isValidQuestion = (q: unknown): q is Question => {
  if (!q || typeof q !== 'object') return false;
  const c = q as Record<string, unknown>;
  return (
    typeof c.id === 'string' && c.id.length > 0 &&
    typeof c.category === 'string' && c.category.length > 0 &&
    typeof c.question === 'string' && c.question.length > 0 &&
    Array.isArray(c.options) && c.options.length === 4 &&
    c.options.every((o) => typeof o === 'string' && o.length > 0) &&
    typeof c.answer === 'string' && (c.options as string[]).includes(c.answer as string) &&
    typeof c.explanation === 'string' &&
    typeof c.difficulty === 'string' && VALID_DIFFICULTIES.has(c.difficulty as string) &&
    // English fields are optional but must be consistent when present
    (c.options_en === undefined ||
      (Array.isArray(c.options_en) && c.options_en.length === 4 &&
        (c.answer_en === undefined || (c.options_en as string[]).includes(c.answer_en as string))))
  );
};

const dedupe = (qs: Question[]): Question[] => {
  const seen = new Set<string>();
  return qs.filter((q) => {
    if (seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });
};

export const QuestionSyncService = {
  /** Load cached remote questions into the runtime pool (instant, offline-safe). */
  async loadCached(): Promise<number> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return 0;
      const valid = dedupe(parsed.filter(isValidQuestion));
      setRemoteQuestions(valid);
      return valid.length;
    } catch {
      return 0;
    }
  },

  /** Fetch active packs from the cloud, validate, cache, and apply. */
  async syncRemote(): Promise<number> {
    try {
      const remote = await CloudService.fetchQuestionPacks();
      if (remote === null) return 0; // offline / not configured — keep cache
      const valid = dedupe(remote.filter(isValidQuestion));
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(valid));
      setRemoteQuestions(valid);
      return valid.length;
    } catch {
      return 0;
    }
  },

  /** Convenience: cached first (fast), then network refresh (fresh). */
  async initialize(): Promise<void> {
    await QuestionSyncService.loadCached();
    QuestionSyncService.syncRemote().catch(() => {});
  },
};
