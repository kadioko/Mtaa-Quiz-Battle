import { getDailyMissionCopy } from '../src/utils/dailyMissions';
import { Colors } from '../src/theme';

describe('getDailyMissionCopy', () => {
  test('uses the correct localized copy for round missions', () => {
    expect(getDailyMissionCopy('rounds', 'sw')).toEqual({
      emoji: '🎮',
      title: 'Cheza raundi 2',
      color: Colors.primary,
    });
    expect(getDailyMissionCopy('rounds', 'en').title).toBe('Play 2 rounds');
  });

  test('uses a distinct correct-answer mission treatment', () => {
    expect(getDailyMissionCopy('correct_answers', 'en')).toEqual({
      emoji: '🎯',
      title: 'Get 12 correct answers',
      color: Colors.secondary,
    });
  });

  test('uses the streak mission as the fallback contract', () => {
    expect(getDailyMissionCopy('answer_streak', 'en')).toEqual({
      emoji: '🔥',
      title: 'Reach a 5-answer streak',
      color: Colors.gold,
    });
  });
});
