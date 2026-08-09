import { categories } from '../data/categories';
import { Category, QuizResult } from '../types';

export type FocusReason = 'practice' | 'weakest' | 'explore' | 'keep-playing';

export interface TrainingRecommendation {
  reason: FocusReason;
  category?: Category;
  mistakeCount: number;
  accuracy?: number;
}

interface CategoryStats {
  correct: number;
  total: number;
  games: number;
}

const playableCategoryIds = new Set(categories.map((category) => category.id));

export function getUnresolvedMistakeCount(history: QuizResult[]): number {
  const seen = new Set<string>();
  let mistakes = 0;

  for (const result of history) {
    for (const item of result.reviewItems ?? []) {
      if (seen.has(item.questionId)) continue;
      seen.add(item.questionId);
      if (!item.wasCorrect) mistakes += 1;
    }
  }

  return mistakes;
}

export function getTrainingRecommendation(
  history: QuizResult[],
  rotationIndex = 0
): TrainingRecommendation {
  const mistakeCount = getUnresolvedMistakeCount(history);
  if (mistakeCount >= 3) {
    return { reason: 'practice', mistakeCount };
  }

  const stats = new Map<string, CategoryStats>();
  for (const result of history) {
    if (!playableCategoryIds.has(result.categoryId) || result.totalQuestions <= 0) continue;
    const current = stats.get(result.categoryId) ?? { correct: 0, total: 0, games: 0 };
    current.correct += result.correctAnswers;
    current.total += result.totalQuestions;
    current.games += 1;
    stats.set(result.categoryId, current);
  }

  const played = categories
    .map((category) => ({ category, stats: stats.get(category.id) }))
    .filter((entry): entry is { category: Category; stats: CategoryStats } => Boolean(entry.stats))
    .map((entry) => ({ ...entry, accuracy: Math.round((entry.stats.correct / entry.stats.total) * 100) }));

  const weakest = [...played].sort((a, b) => a.accuracy - b.accuracy || a.stats.games - b.stats.games)[0];
  if (weakest && weakest.accuracy < 70) {
    return {
      reason: 'weakest',
      category: weakest.category,
      mistakeCount,
      accuracy: weakest.accuracy,
    };
  }

  const unplayed = categories.filter((category) => !stats.has(category.id));
  if (unplayed.length > 0) {
    const index = Math.abs(rotationIndex) % unplayed.length;
    return { reason: 'explore', category: unplayed[index], mistakeCount };
  }

  if (weakest) {
    return {
      reason: 'keep-playing',
      category: weakest.category,
      mistakeCount,
      accuracy: weakest.accuracy,
    };
  }

  return { reason: 'explore', category: categories[0], mistakeCount };
}
