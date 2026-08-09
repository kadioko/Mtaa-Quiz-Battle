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
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

export type SfxType = 'correct' | 'wrong' | 'timeup';

const SOURCES: Record<SfxType, number> = {
  correct: require('../../assets/sounds/correct.mp3'),
  wrong: require('../../assets/sounds/wrong.mp3'),
  timeup: require('../../assets/sounds/timeup.mp3'),
};

const players: Partial<Record<SfxType, AudioPlayer>> = {};
let preloaded = false;

function createPlayer(type: SfxType): AudioPlayer {
  const player = createAudioPlayer(SOURCES[type]);
  player.volume = 0.7;
  return player;
}

export const SoundService = {
  /** Load all sound effects into memory. Safe to call multiple times. */
  async preload(): Promise<void> {
    if (preloaded) return;
    preloaded = true;
    (Object.keys(SOURCES) as SfxType[]).forEach((type) => {
      try {
        players[type] = createPlayer(type);
      } catch {
        // Sound files are optional.
      }
    });
  },

  /** Play a sound effect (no-op when disabled or unavailable). */
  async play(type: SfxType, enabled: boolean): Promise<void> {
    if (!enabled) return;
    try {
      const player = players[type];
      if (player) {
        await player.seekTo(0);
        player.play();
        return;
      }
      // Fallback: create and retain the player for future answers.
      const fallback = createPlayer(type);
      players[type] = fallback;
      fallback.play();
    } catch {
      // Silently fail — sound is non-critical
    }
  },

  /** Release all loaded sounds (call on app teardown if needed). */
  async unloadAll(): Promise<void> {
    await Promise.all(
      (Object.keys(players) as SfxType[]).map(async (type) => {
        try {
          players[type]?.remove();
        } catch {}
        delete players[type];
      })
    );
    preloaded = false;
  },
};
