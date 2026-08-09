import { QuizResult } from '../src/types';
import { getTrainingRecommendation, getUnresolvedMistakeCount } from '../src/utils/recommendations';

const result = (overrides: Partial<QuizResult> = {}): QuizResult => ({
  id: 'r1',
  categoryId: 'bongo-fleva',
  categoryName: 'Bongo Fleva',
  score: 100,
  correctAnswers: 8,
  totalQuestions: 10,
  coinsEarned: 10,
  maxStreak: 2,
  accuracy: 80,
  date: '2026-08-09T00:00:00.000Z',
  isDaily: false,
  ...overrides,
});

describe('training recommendations', () => {
  test('prioritizes unresolved mistakes', () => {
    const history = [
      result({ reviewItems: [
        { questionId: 'q1', question: 'Q', category: 'Bongo Fleva', selectedAnswer: 'A', correctAnswer: 'B', explanation: 'E', difficulty: 'easy', wasCorrect: false, timedOut: false },
        { questionId: 'q2', question: 'Q', category: 'Bongo Fleva', selectedAnswer: 'A', correctAnswer: 'B', explanation: 'E', difficulty: 'easy', wasCorrect: false, timedOut: false },
        { questionId: 'q3', question: 'Q', category: 'Bongo Fleva', selectedAnswer: 'A', correctAnswer: 'B', explanation: 'E', difficulty: 'easy', wasCorrect: false, timedOut: false },
      ] }),
    ];

    expect(getTrainingRecommendation(history).reason).toBe('practice');
  });

  test('uses the latest answer for a question when counting mistakes', () => {
    const history = [
      result({ id: 'new', reviewItems: [
        { questionId: 'q1', question: 'Q', category: 'Bongo Fleva', selectedAnswer: 'B', correctAnswer: 'B', explanation: 'E', difficulty: 'easy', wasCorrect: true, timedOut: false },
      ] }),
      result({ id: 'old', reviewItems: [
        { questionId: 'q1', question: 'Q', category: 'Bongo Fleva', selectedAnswer: 'A', correctAnswer: 'B', explanation: 'E', difficulty: 'easy', wasCorrect: false, timedOut: false },
      ] }),
    ];

    expect(getUnresolvedMistakeCount(history)).toBe(0);
  });

  test('recommends the weakest played category before exploring', () => {
    const history = [
      result({ categoryId: 'bongo-fleva', correctAnswers: 9, totalQuestions: 10 }),
      result({ id: 'r2', categoryId: 'simba-yanga', correctAnswers: 4, totalQuestions: 10 }),
    ];

    const recommendation = getTrainingRecommendation(history);
    expect(recommendation.reason).toBe('weakest');
    expect(recommendation.category?.id).toBe('simba-yanga');
    expect(recommendation.accuracy).toBe(40);
  });

  test('rotates through unexplored categories for strong players', () => {
    const history = [result({ categoryId: 'bongo-fleva', correctAnswers: 9, totalQuestions: 10 })];

    const recommendation = getTrainingRecommendation(history, 1);
    expect(recommendation.reason).toBe('explore');
    expect(recommendation.category?.id).toBe('mikoa');
  });
});
