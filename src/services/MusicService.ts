/**
 * MusicService — per-category background music with fade-in/out.
 *
 * Track files live in assets/music/. They are optional — if a file is missing
 * the service silently no-ops so the rest of the app keeps working.
 *
 * Category → track mapping (add mp3 files to assets/music/ to activate):
 *   bongo-fleva          → bongo.mp3
 *   historia-ya-tanzania → history.mp3
 *   mchezo-wa-soka       → soka.mp3
 *   wanyamapori          → safari.mp3
 *   jiografia-ya-afrika  → africa.mp3
 *   sayansi-na-teknolojia → science.mp3
 *   lugha-ya-kiswahili   → swahili.mp3
 *   vyakula-vya-tanzania → vyakula.mp3
 *   utamaduni-wa-tanzania → utamaduni.mp3
 *   mikoa-ya-tanzania    → mikoa.mp3
 *   sprint / daily       → sprint.mp3
 *   default              → default.mp3
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

type TrackKey =
  | 'bongo-fleva'
  | 'historia-ya-tanzania'
  | 'mchezo-wa-soka'
  | 'wanyamapori'
  | 'jiografia-ya-afrika'
  | 'sayansi-na-teknolojia'
  | 'lugha-ya-kiswahili'
  | 'vyakula-vya-tanzania'
  | 'utamaduni-wa-tanzania'
  | 'mikoa-ya-tanzania'
  | 'sprint'
  | 'default';

const TRACK_MAP: Partial<Record<TrackKey, number>> = {
  // Uncomment and add files to assets/music/ to activate each track.
  // 'bongo-fleva':           require('../../assets/music/bongo.mp3'),
  // 'historia-ya-tanzania':  require('../../assets/music/history.mp3'),
  // 'mchezo-wa-soka':        require('../../assets/music/soka.mp3'),
  // 'wanyamapori':           require('../../assets/music/safari.mp3'),
  // 'jiografia-ya-afrika':   require('../../assets/music/africa.mp3'),
  // 'sayansi-na-teknolojia': require('../../assets/music/science.mp3'),
  // 'lugha-ya-kiswahili':    require('../../assets/music/swahili.mp3'),
  // 'vyakula-vya-tanzania':  require('../../assets/music/vyakula.mp3'),
  // 'utamaduni-wa-tanzania': require('../../assets/music/utamaduni.mp3'),
  // 'mikoa-ya-tanzania':     require('../../assets/music/mikoa.mp3'),
  // 'sprint':                require('../../assets/music/sprint.mp3'),
  // 'default':               require('../../assets/music/default.mp3'),
};

const FADE_STEPS = 10;
const FADE_INTERVAL_MS = 50;
const MAX_VOLUME = 0.45;

let currentSound: AudioPlayer | null = null;
let fadeTimer: ReturnType<typeof setInterval> | null = null;
let _enabled = true;

const clearFade = () => {
  if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
};

const resolveKey = (categoryId: string): TrackKey => {
  if (categoryId in TRACK_MAP) return categoryId as TrackKey;
  if (categoryId === 'sprint') return 'sprint';
  return 'default';
};

export const MusicService = {
  setEnabled(enabled: boolean) { _enabled = enabled; },

  async play(categoryId: string) {
    if (!_enabled || Platform.OS === 'web') return;
    const key = resolveKey(categoryId);
    const source = TRACK_MAP[key];
    if (!source) return; // No track file yet — silent no-op

    try {
      // Stop existing track
      await MusicService.stop(false);

      await setAudioModeAsync({
        playsInSilentMode: false,
        shouldPlayInBackground: false,
      });

      const sound = createAudioPlayer(source);
      sound.loop = true;
      sound.volume = 0;
      sound.play();
      currentSound = sound;

      // Fade in
      clearFade();
      let step = 0;
      fadeTimer = setInterval(async () => {
        step++;
        const vol = Math.min((step / FADE_STEPS) * MAX_VOLUME, MAX_VOLUME);
        try { sound.volume = vol; } catch {}
        if (step >= FADE_STEPS) clearFade();
      }, FADE_INTERVAL_MS);
    } catch {
      // Missing file or permission issue — fail silently
    }
  },

  async stop(fade = true) {
    clearFade();
    const s = currentSound;
    if (!s) return;
    currentSound = null;

    if (!fade) {
      try { s.pause(); s.remove(); } catch {}
      return;
    }

    // Fade out
    let step = FADE_STEPS;
    fadeTimer = setInterval(async () => {
      step--;
      const vol = Math.max((step / FADE_STEPS) * MAX_VOLUME, 0);
      try { s.volume = vol; } catch {}
      if (step <= 0) {
        clearFade();
        try { s.pause(); s.remove(); } catch {}
      }
    }, FADE_INTERVAL_MS);
  },

  async pause() {
    try { currentSound?.pause(); } catch {}
  },

  async resume() {
    if (!_enabled) return;
    try { currentSound?.play(); } catch {}
  },
};
