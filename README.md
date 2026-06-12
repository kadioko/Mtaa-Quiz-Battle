# Mtaa Quiz Battle

A **Swahili-first Tanzanian trivia game** built with React Native + Expo.
Test your knowledge of Tanzania — music, football, geography, history, food, language, and more.

---

## Screens

| Screen | File | Description |
| --- | --- | --- |
| **Splash** | `index.tsx` | Animated logo + pulsing dots, bilingual tagline, theme-aware gradient |
| **Home** | `home.tsx` | Personalised greeting, stats, daily challenge banner, daily reward |
| **Categories** | `categories.tsx` | 10 category cards, live search, difficulty filter chips, play-count badges |
| **Quiz** | `quiz.tsx` | 10 questions, timer, dot stepper, floating score gain, collapsible explanation, adaptive difficulty |
| **Result** | `result.tsx` | Animated score counter, new-record banner, per-question answer breakdown, share card |
| **Leaderboard** | `leaderboard.tsx` | All / Daily / Best filter tabs, top-50 scores |
| **Profile** | `profile.tsx` | Rank banner, achievements grid, category mastery bars, recent game history, avatar picker, stats |
| **Settings** | `settings.tsx` | Sound, music, vibration, light/dark mode, language toggle, notifications, premium |
| **Daily Challenge** | `daily.tsx` | Date-seeded daily quiz, streak tracking, live midnight countdown when done |
| **Sprint** | `sprint.tsx` | 60-second rapid-fire mode with best-score tracking |
| **Versus** | `versus.tsx` | Pass-and-play for **2–4 players** on one phone, handover screens, podium results |
| **Friend Challenge** | `challenge.tsx` | **Cross-device async multiplayer** — create/join by 6-char code, ranked standings (Supabase) |
| **Shop** | `shop.tsx` | Coin-powered shop (streak freezes), premium options |
| **Sign In** | `signin.tsx` | Magic-link email sign-in for cloud sync |
| **Onboarding** | `onboarding.tsx` | First-launch tutorial |

---

## ✨ Features

### Gameplay

- **626 questions** across 10 categories in Swahili (+ full English translations)
- **7 game modes**: Classic, Daily, Weekly Challenge, Sprint, Versus (2–4 players), Friend Challenge (cross-device), Practice Mistakes
- **Difficulty levels**: Easy / Medium / Hard — each with a score **multiplier** (×1 / ×1.5 / ×2)
- **Scoring**: Base 100 + Speed bonus (up to +50) + Streak bonus (+30 at streak ≥ 3) × difficulty multiplier
- **Adaptive difficulty** — after 30 games + 200 answered questions, question selection biases toward the player's weak difficulty tiers per category
- **Floating score gain** animation (`+150`) on every correct answer
- **Question dot stepper** — green = correct, red = wrong, orange = current
- **Timer bar** with colour shift (green → orange → red at ≤ 5s)
- **Timeout feedback** — clear visual and haptic cue when time expires
- **Collapsible explanation** card after each answer with category colour context
- **Pause / quit confirmation** modal during a quiz
- **Review mode** on result screen — inspect every question with correct answer highlighted
- **Haptic feedback** (correct ✅ / wrong ❌ / time-up ⚠️)
- **Sound effects** (respects sound toggle in Settings)

### Daily Challenge

- New set of 10 mixed-category questions every day (date-seeded, one per category when possible)
- Deterministic: same question set for all players on a given day, regardless of device
- **Daily streak** tracking across consecutive days
- **Live countdown timer** (HH:MM:SS) to next challenge when already played
- ✅ DONE badge on home screen banner when already played

### Rewards & Progress

- **Coins** earned every game — base from score + accuracy bonus (≥80% → +10, ≥60% → +5)
- **Daily login reward** — coins scale with consecutive-day streak (10 → 50 max)
- **New Record** 🏆 pulsing banner on result screen

### Player Ranks

10 levels unlocked by total coin count:

| Level | Title (sw) | Title (en) | Coins needed |
| --- | --- | --- | --- |
| 1 | Mgeni 🌱 | Newcomer | 0 |
| 2 | Mwanafunzi 📚 | Student | 50 |
| 3 | Mchezaji 🎮 | Player | 150 |
| 4 | Hodari ⚡ | Skilled | 350 |
| 5 | Bingwa 🏆 | Champion | 700 |
| 6 | Msomi 🧠 | Scholar | 1 200 |
| 7 | Simba wa Mtaa 🦁 | Street Lion | 2 000 |
| 8 | Mfalme 👑 | King | 3 500 |
| 9 | Hadithi 🌟 | Legend | 5 000 |
| 10 | Gwiji wa Bongo 🐐 | Grandmaster | 8 000 |

The profile screen shows a rank banner with a progress bar toward the next rank and coins needed.

### Achievements (27 total)

Automatically unlocked after each game, stored in AsyncStorage:

| Achievement | Trigger |
| --- | --- |
| Mchezo wa Kwanza 🎮 | Play 1 game |
| Mchezaji 10 🔟 | Play 10 games |
| Mchezaji 50 / 100 / 250 | Play 50 / 100 / 250 games |
| Mfululizo 3 🔥 / 7 🔥🔥 | Get a question streak of 3 / 7 |
| Mfululizo 30 ⚡ | Maintain a 30-day play streak |
| Raundi Kamili ⭐ | Perfect round (10/10) |
| Raundi 5 Kamili 🌟 | 5 perfect rounds |
| Usahihi 80% 🎯 / 90% 💎 | 80% / 90% overall accuracy (min 20 questions) |
| Wiki ya Kila Siku 📅 | 7-day daily streak |
| Mwezi wa Kila Siku 🗓️ | 30-day daily streak |
| Sarafu 100 🪙 / 500 💰 / 1000 🏦 | Collect 100 / 500 / 1000 coins |
| Mtaalamu 🗺️ | Play in all 10 categories |
| Mwepesi ⚡ | Earn 10 speed bonuses |
| Mbio za Kwanza 🏃 / Mbio 50 💨 / Mbio 100 🚀 | Sprint: first run / 50 / 100 questions answered |
| Mtoa Vidokezo 💡 | Use hints 20 times |
| Shujaa wa Versus 🥊 | Win a Versus match |
| Barafu Imetumika 🧊 | A Streak Freeze protects your streak |
| Makosa Yamesahihishwa 🧠 | Perfect score in Practice Mistakes |
| Mshindani 🏁 | Play a Friend Challenge |

### Category Mastery

Profile shows an accuracy bar per category (sorted by accuracy), with games played and correct/total count, computed from full quiz history.

### Profile

- **Rank banner** with level, emoji, title, progress bar to next rank
- **Achievements grid** — unlocked badges full opacity, locked badges dimmed; "View All" toggle
- **Category mastery bars** — per-category accuracy from all non-daily games
- **Recent game history** — last 10 games: category, date, score, accuracy, coins earned
- **Emoji avatar picker** — 16 options, persisted to storage; edit badge tinted by rank colour
- **Username editor** — tap to edit, saved immediately
- Overall stats: total games, best score, coins, accuracy, streaks, favourite category
- **Animated accuracy progress bar**

### Leaderboard

- Source tabs: **📱 Local** / **🌐 Global** (Supabase) / **🗺️ Mikoa** (regional league)
- Filter tabs: **All** / **Daily** / **Best** (one entry per player) — applied to local and global
- Regional league aggregates every player's cloud scores by their chosen mkoa (all 31 regions supported)
- Local top-50 entries sorted by score

### Cloud Features (optional, Supabase REST)

- Global leaderboard, cross-device progress sync, magic-link sign-in
- **Friend Challenges** — async cross-device multiplayer by share code
- **Regional league** — pick your mkoa in Profile, compete Dar vs Mwanza vs Arusha…
- Push notifications with deep links (daily reminder → daily challenge)
- All optional: app is fully playable offline; see `docs/CLOUD_SETUP.md`

### Categories

- **Live search** by Swahili or English name
- **Difficulty filter chips** (All / Rahisi / Wastani / Ngumu)
- **Play-count badge** (e.g. `3×`) on cards you've already played

### Localisation

- Full **Swahili / English** toggle in Settings (persisted)
- All UI strings via `t(key)` in `src/utils/i18n.ts`
- Questions carry `_en` variants for every text field

### Technical

- **Offline-first** — all state in AsyncStorage; optional Supabase REST backend for cloud features (no SDK dependency)
- **Expo Router v3** file-based navigation
- **TypeScript** strict mode throughout
- **Theme system** — light/dark tokens via `useThemeColors()`, all screens themed
- Adaptive difficulty using per-category accuracy history
- Achievement evaluation runs after every completed game
- Quiz history capped at 100; leaderboard capped at 50

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js 18+
- `npx expo` (no global install needed)
- Android device / emulator, iOS simulator, or Expo Go

### Install

```bash
npm install
```

### Run

```bash
npm start                # QR code for Expo Go
npm run start:tunnel     # Tunnel mode for external networks
npm run android          # Android emulator / device
npm run ios              # iOS simulator
npm run web              # Web preview
```

### Quality checks

```bash
npm run typecheck        # TypeScript strict check
npm run validate:data    # Question data integrity
npm run check:contrast   # WCAG contrast ratios
npm test                 # 87 Jest tests (5 suites)
npm run check            # All four checks in one command (CI gate)
```

Run `npm run check` before every commit that touches gameplay, storage, routing, or question data.

---

## 🏗️ EAS Builds

Three profiles defined in `eas.json`:

```bash
# Internal test build (APK)
eas build --platform android --profile preview

# Production bundle (AAB + IPA)
eas build --platform all --profile production

# Submit to stores
eas submit --platform android --profile production
```

See `docs/RELEASE_CHECKLIST.md` for the full pre-release process.

---

## 🧪 Tests

87 tests across 5 suites in `__tests__/`:

| Suite | What it tests |
| --- | --- |
| `scoring.test.ts` | `calculateScore`, `calculateCoins`, `buildQuizResult`, ranks, achievements |
| `dailyChallenge.test.ts` | Determinism, uniqueness, category spread, required fields |
| `storageMigration.test.ts` | Profile defaults, partial-save migration, `dailyCompleted` reset, corrupted JSON fallback |
| `leaderboard.test.ts` | Sort, 50-entry cap, invalid-score filter, add/sort, client-side filters |
| `webRoutes.smoke.test.ts` | Every route file, every core source file, all asset files exist |

---

## 📁 Project Structure

```text
Mtaa Quiz Battle/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout + providers
│   ├── index.tsx                 # Splash screen
│   ├── home.tsx                  # Home — greeting, stats, daily banner
│   ├── categories.tsx            # Category grid — search + difficulty filter
│   ├── quiz.tsx                  # Quiz gameplay + adaptive difficulty
│   ├── result.tsx                # Score, breakdown, review mode, share
│   ├── leaderboard.tsx           # Local leaderboard with filter tabs
│   ├── profile.tsx               # Rank, achievements, mastery, history, stats
│   ├── settings.tsx              # Sound, vibration, theme, language
│   └── daily.tsx                 # Daily challenge + countdown
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── AnswerButton.tsx
│   │   ├── GradientBackground.tsx
│   │   ├── PrimaryButton.tsx
│   │   ├── StatCard.tsx
│   │   └── TimerBar.tsx
│   ├── data/
│   │   ├── questions.ts          # 626 bilingual questions (q001–q626) + seeded daily/weekly selectors
│   │   ├── categories.ts         # 10 category definitions (counts auto-calculated)
│   │   └── regions.ts            # 31 Tanzanian regions for the regional league
│   ├── services/
│   │   ├── CloudService.ts       # Supabase REST: leaderboard, sync, auth, challenges
│   │   ├── SoundService.ts       # Preloaded sound effects (single swap point for expo-audio)
│   │   ├── MusicService.ts       # Background music
│   │   ├── NotificationService.ts# Daily reminders + deep links
│   │   ├── AdService.ts          # Rewarded ads (AdMob)
│   │   └── IAPService.ts         # In-app purchases
│   ├── storage/
│   │   └── storage.ts            # StorageService: profile, settings, leaderboard,
│   │                             #   history, category stats, achievements
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts              # Question, Category, QuizResult, UserProfile,
│   │                             #   PlayerRank, Achievement, CategoryMastery, …
│   └── utils/
│       ├── gameLogic.ts          # Scoring, coins, ranks, achievements, mastery,
│       │                         #   adaptive difficulty, daily question selection
│       ├── i18n.ts               # sw/en translation map + t() helper
│       ├── ThemeContext.tsx       # useThemeColors() hook
│       └── LanguageContext.tsx    # Language state + persistence
├── __tests__/                    # Jest test suites
│   ├── scoring.test.ts
│   ├── dailyChallenge.test.ts
│   ├── storageMigration.test.ts
│   ├── leaderboard.test.ts
│   └── webRoutes.smoke.test.ts
├── scripts/
│   ├── validate-data.mjs         # Question data validator
│   ├── check-contrast.mjs        # WCAG contrast checker
│   ├── inject-questions.mjs      # Batch question injector
│   └── q-<slug>.mjs              # Per-category question data files
├── docs/
│   ├── AUTHORING_GUIDE.md        # Full question authoring guide
│   ├── QUESTION_AUTHORING.md     # Concise authoring rules
│   ├── RELEASE_CHECKLIST.md      # Pre-release checklist (10 sections)
│   └── ROADMAP.md                # Feature roadmap
├── assets/
│   ├── icon.png                  # 1024×1024 app icon
│   ├── splash.png                # 1242×2436 splash
│   ├── adaptive-icon.png         # Android adaptive icon foreground
│   ├── favicon.png               # Web favicon
│   └── sounds/
│       ├── correct.mp3
│       ├── wrong.mp3
│       └── timeup.mp3
├── app.json                      # Expo config
├── eas.json                      # EAS build profiles
├── babel.config.js
├── package.json
└── tsconfig.json
```

---

## ➕ Adding Questions

**Recommended:** use the batch injector for multiple questions:

```bash
# 1. Create scripts/q-<category-slug>.mjs with your questions array
# 2. Add it to the import list in scripts/inject-questions.mjs
# 3. Run:
node scripts/inject-questions.mjs
npm run validate:data
```

**Manual:** append directly to `src/data/questions.ts`:

```typescript
{
  id: 'q503',                              # next available ID
  category: 'General Knowledge TZ',        # must match categories.ts exactly
  question: 'Swali lako hapa?',
  question_en: 'Your question here?',
  options: ['A', 'B', 'C', 'D'],
  options_en: ['A', 'B', 'C', 'D'],
  answer: 'B',
  answer_en: 'B',
  explanation: 'Maelezo ya Kiswahili.',
  explanation_en: 'English explanation.',
  difficulty: 'medium',
},
```

Category question counts update automatically (calculated at runtime in `categories.ts`).
See `docs/AUTHORING_GUIDE.md` for full field reference, difficulty guidelines, and per-category examples.

---

## 🏗️ Adding Categories

1. Add questions with the new category name in `src/data/questions.ts`
2. Add an entry in `src/data/categories.ts`
3. Add a colour entry in `src/theme/colors.ts` under `CategoryColors`

---

## 🌍 Language System

- Toggle **Kiswahili ↔ English** in Settings (persisted to AsyncStorage)
- All UI strings go through `t(key)` from `src/utils/i18n.ts`
- Language state lives in `LanguageContext` — all screens re-render on change
- Questions carry `_en` variants for every text field

---

## 🎯 Scoring Formula

```text
points = round((BASE(100) + speedBonus(0–50) + streakBonus(30 if streak≥3)) × difficultyMultiplier)

difficultyMultiplier:  easy = ×1  |  medium = ×1.5  |  hard = ×2
speedBonus:            timeRemaining / totalTime × 50
streakBonus:           +30 when in-question streak ≥ 3 correct in a row

coinsEarned = floor(score / 50) + accuracyBonus
accuracyBonus:         ≥80% correct → +10  |  ≥60% → +5  |  <60% → 0
```

---

## 📝 Notes

- All data is stored locally — no internet required after install
- Roadmap lives in `docs/ROADMAP.md`; release process in `docs/RELEASE_CHECKLIST.md`
- Daily challenge questions are date-seeded — same set for every player on a given day
- `dailyCompleted` flag auto-resets at midnight inside `getUserProfile()`
- Achievement evaluation runs inside `updateProfileAfterGame()` — no extra call needed
- Adaptive difficulty is inactive until ≥30 games and ≥200 answered questions (prevents bias on new accounts)
- Leaderboard capped at 50 entries; quiz history capped at 100 results
- Category play counts exclude daily challenge results so favourite category reflects regular play

---

Built with ❤️ for Tanzania 🇹🇿 | v1.1.0 — see [CHANGELOG.md](CHANGELOG.md)
