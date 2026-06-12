/**
 * SoundService — centralized, preloaded sound effects.
 *
 * Replaces the three duplicated `playSound` helpers in quiz/sprint/versus.
 * Sounds are loaded once and replayed, instead of creating a new
 * Audio.Sound on every answer (lower latency, no per-play allocations).
 *
 * NOTE: expo-av is deprecated. When migrating to expo-audio
 * (`npx expo install expo-audio`), this is the ONLY file that needs to change.
 */
import { Audio } from 'expo-av';

export type SfxType = 'correct' | 'wrong' | 'timeup';

const SOURCES: Record<SfxType, number> = {
  correct: require('../../assets/sounds/correct.mp3'),
  wrong: require('../../assets/sounds/wrong.mp3'),
  timeup: require('../../assets/sounds/timeup.mp3'),
};

const players: Partial<Record<SfxType, Audio.Sound>> = {};
let preloaded = false;

export const SoundService = {
  /** Load all sound effects into memory. Safe to call multiple times. */
  async preload(): Promise<void> {
    if (preloaded) return;
    preloaded = true;
    await Promise.all(
      (Object.keys(SOURCES) as SfxType[]).map(async (type) => {
        try {
          const { sound } = await Audio.Sound.createAsync(SOURCES[type], {
            shouldPlay: false,
            volume: 0.7,
          });
          players[type] = sound;
        } catch {
          // Sound files optional — silently skip if missing
        }
      })
    );
  },

  /** Play a sound effect (no-op when disabled or unavailable). */
  async play(type: SfxType, enabled: boolean): Promise<void> {
    if (!enabled) return;
    try {
      const player = players[type];
      if (player) {
        await player.replayAsync();
        return;
      }
      // Fallback: not preloaded — fire-and-forget one-shot
      const { sound } = await Audio.Sound.createAsync(SOURCES[type], {
        shouldPlay: true,
        volume: 0.7,
      });
      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) sound.unloadAsync();
      });
    } catch {
      // Silently fail — sound is non-critical
    }
  },

  /** Release all loaded sounds (call on app teardown if needed). */
  async unloadAll(): Promise<void> {
    await Promise.all(
      (Object.keys(players) as SfxType[]).map(async (type) => {
        try {
          await players[type]?.unloadAsync();
        } catch {}
        delete players[type];
      })
    );
    preloaded = false;
  },
};
