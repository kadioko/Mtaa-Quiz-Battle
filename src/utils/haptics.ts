/**
 * HapticService — distinct haptic patterns for game events.
 * All calls are no-ops when vibration is disabled or on unsupported platforms.
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const supported = Platform.OS !== 'web';

const safe = (fn: () => Promise<void>) => {
  if (!supported) return;
  fn().catch(() => {});
};

export const HapticService = {
  /** Short tap on every correct answer */
  correctAnswer(enabled: boolean) {
    if (!enabled) return;
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },

  /** Double-thud on wrong answer */
  wrongAnswer(enabled: boolean) {
    if (!enabled) return;
    safe(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise((r) => setTimeout(r, 80));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    });
  },

  /** Soft warning buzz on time-up */
  timeUp(enabled: boolean) {
    if (!enabled) return;
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  },

  /** Ascending triple tap for streak milestone (3, 5, 10…) */
  streakMilestone(enabled: boolean) {
    if (!enabled) return;
    safe(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise((r) => setTimeout(r, 60));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise((r) => setTimeout(r, 60));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    });
  },

  /** Long heavy thud + success notification for level-up */
  levelUp(enabled: boolean) {
    if (!enabled) return;
    safe(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise((r) => setTimeout(r, 100));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  },

  /** Rapid fire for achievement unlock — light×3 then success */
  achievementUnlock(enabled: boolean) {
    if (!enabled) return;
    safe(async () => {
      for (let i = 0; i < 3; i++) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await new Promise((r) => setTimeout(r, 50));
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  },

  /** Light selection tick (UI interactions) */
  selection(enabled: boolean) {
    if (!enabled) return;
    safe(() => Haptics.selectionAsync());
  },
};
