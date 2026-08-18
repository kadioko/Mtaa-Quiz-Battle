import { DailyMission, DailyMissionId } from '../types';
import { Colors } from '../theme';

export interface DailyMissionCopy {
  emoji: string;
  title: string;
  color: string;
}

export const getDailyMissionCopy = (
  mission: Pick<DailyMission, 'id'> | DailyMissionId,
  language: 'sw' | 'en'
): DailyMissionCopy => {
  const id = typeof mission === 'string' ? mission : mission.id;
  const sw = language === 'sw';

  if (id === 'rounds') {
    return {
      emoji: '🎮',
      title: sw ? 'Cheza raundi 2' : 'Play 2 rounds',
      color: Colors.primary,
    };
  }

  if (id === 'correct_answers') {
    return {
      emoji: '🎯',
      title: sw ? 'Pata majibu 12 sahihi' : 'Get 12 correct answers',
      color: Colors.secondary,
    };
  }

  return {
    emoji: '🔥',
    title: sw ? 'Fikia mfululizo wa 5' : 'Reach a 5-answer streak',
    color: Colors.gold,
  };
};
