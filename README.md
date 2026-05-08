# Mtaa Quiz Battle

A **Swahili-first Tanzanian trivia game** built with React Native + Expo.
Test your knowledge of Tanzania — music, football, geography, history, food, language, and more.

---

## Screens

| Screen | Description |
| --- | --- |
| **Splash** (`index.tsx`) | Animated logo + pulsing dots, bilingual tagline |
| **Home** (`home.tsx`) | Personalised greeting, stats, daily challenge banner, daily reward |
| **Categories** (`categories.tsx`) | 10 category cards, live search, difficulty filter chips, play-count badges |
| **Quiz** (`quiz.tsx`) | 10 questions, timer, dot stepper, floating score gain, collapsible explanation |
| **Result** (`result.tsx`) | Animated score counter, new-record banner, answer breakdown, share card |
| **Leaderboard** (`leaderboard.tsx`) | All / Daily / Best filter tabs, top-50 scores |
| **Profile** (`profile.tsx`) | Avatar emoji picker, username editor, animated accuracy bar, stats |
| **Settings** (`settings.tsx`) | Sound, vibration, language toggle, version info |
| **Daily Challenge** (`daily.tsx`) | Daily quiz, streak tracking, live midnight countdown when done |

---

## ✨ Features

### Gameplay

- **102+ Questions** across 10 categories in Swahili (+ English translations)
- **Difficulty levels**: Easy / Medium / Hard — each with a score **multiplier** (×1 / ×1.5 / ×2)
- **Scoring**: Base 100 + Speed bonus (up to +50) + Streak bonus (+30 at streak ≥ 3) × difficulty multiplier
- **Floating score gain** animation (`+150`) on every correct answer
- **Question dot stepper** — green = correct, red = wrong, orange = current
- **Timer bar** with colour shift (green → orange → red at ≤ 5s)
- **Collapsible explanation** card after each answer
- **Haptic feedback** (correct ✅ / wrong ❌ / time-up ⚠️)
- **Sound effects** (respects sound toggle in Settings)

### Daily Challenge

- New set of 10 mixed-category questions every day (date-seeded, one from each category when possible)
- **Daily streak** tracking across consecutive days
- **Live countdown timer** (HH:MM:SS) to next challenge when already played
- ✅ DONE badge on home screen banner when already played

### Rewards & Progress

- **Daily login reward** — coins scale with consecutive-day streak (10 → 50 max)
- **Streak reset** notice when consecutive days are broken
- **New Record** 🏆 pulsing banner on result screen

### Profile

- **Emoji avatar picker** — 16 options, persisted to storage
- **Username editor** — tap to edit, saved immediately
- Total games, best score, coins, accuracy, current/longest streak, favourite category
- **Animated accuracy progress bar**

### Leaderboard

- Filter tabs: **All** / **Daily** / **Best** (one entry per player)
- Top-50 entries sorted by score

### Categories

- **Live search** by Swahili or English name
- **Difficulty filter chips** (All / Rahisi / Wastani / Ngumu)
- **Play-count badge** (e.g. `3×`) on cards you've already played

### Localisation

- Full **Swahili / English** toggle in Settings
- All UI strings via `t(key)` in `src/utils/i18n.ts`
- Questions have `_en` fields for every text property

### Technical

- **Offline-first** — zero backend, all data in AsyncStorage
- **Expo Router v3** file-based navigation
- **TypeScript** strict mode throughout
- Result history stores per-question correctness for accurate answer breakdowns
- Category stats track play counts and the profile favourite category
- Data validator catches duplicate options, missing translations, bad category links, and daily challenge regressions
- `npm run typecheck` = strict TypeScript check

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js 18+
- Expo CLI via `npx expo` or a global install
- Android device / emulator or Expo Go app

### Install

```bash
cd "Mtaa Quiz Battle"
npm install
```

### Run

```bash
npm start                # Scan QR with Expo Go
npm run start:tunnel     # Tunnel mode for external devices/networks
npm run android          # Launch on Android emulator/device
npm run ios              # Launch on iOS simulator
npm run web              # Launch web preview
```

### Quality Checks

```bash
npm run typecheck
npm run validate:data
npm run check
```

Run `npm run check` before committing gameplay, storage, routing, or question-data changes.

### Build APK

```bash
# Classic build (deprecated but simple)
npx expo build:android

# EAS Build (recommended)
eas build --platform android --profile preview
```

---

## 📁 Project Structure

```text
Mtaa Quiz Battle/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root layout + LanguageContext provider
│   ├── index.tsx               # Splash screen (animated)
│   ├── home.tsx                # Home — greeting, stats, daily banner
│   ├── categories.tsx          # Category grid — search + difficulty filter
│   ├── quiz.tsx                # Quiz gameplay
│   ├── result.tsx              # Results — score, breakdown, share
│   ├── leaderboard.tsx         # Local leaderboard with filter tabs
│   ├── profile.tsx             # Player profile, avatar picker, stats
│   ├── settings.tsx            # Sound, vibration, language, about
│   └── daily.tsx               # Daily challenge + countdown
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── AnswerButton.tsx    # Answer option with state (correct/wrong/reveal)
│   │   ├── GradientBackground.tsx
│   │   ├── PrimaryButton.tsx   # Themed action button
│   │   ├── StatCard.tsx        # Compact stat display card
│   │   └── TimerBar.tsx        # Animated countdown bar
│   ├── data/                   # Static game data
│   │   ├── questions.ts        # 102+ bilingual questions
│   │   └── categories.ts       # 10 category definitions
│   ├── storage/                # AsyncStorage abstraction
│   │   └── storage.ts          # StorageService — profile, settings, leaderboard, history
│   ├── theme/                  # Design tokens
│   │   ├── colors.ts           # Color palette + CategoryColors map
│   │   ├── typography.ts       # Font sizes & weights
│   │   ├── spacing.ts          # Spacing + Radius scales
│   │   └── index.ts            # Re-exports all tokens
│   ├── types/                  # TypeScript interfaces
│   │   └── index.ts            # Question, Category, QuizResult, UserProfile, etc.
│   └── utils/
│       ├── gameLogic.ts        # calculateScore (with difficulty multiplier), getRating, shuffleOptions
│       ├── i18n.ts             # Swahili/English translation map + t() helper
│       └── LanguageContext.tsx # React context for language state + persistence
├── assets/
│   ├── icon.png
│   ├── splash.png
│   ├── adaptive-icon.png
│   ├── favicon.png
│   └── sounds/
│       ├── correct.mp3
│       ├── wrong.mp3
│       └── timeup.mp3
├── app.json                    # Expo config (scheme, icons, bundle IDs)
├── babel.config.js
├── package.json
└── tsconfig.json
```

---

## ➕ Adding Questions

Edit `src/data/questions.ts`:

```typescript
{
  id: 'q103',
  category: 'General Knowledge TZ',   // must match a category name exactly
  question: 'Swali lako hapa?',
  question_en: 'Your question here?',
  options: ['A', 'B', 'C', 'D'],
  options_en: ['A', 'B', 'C', 'D'],
  answer: 'B',
  answer_en: 'B',
  explanation: 'Maelezo ya Kiswahili.',
  explanation_en: 'English explanation.',
  difficulty: 'medium',              // 'easy' | 'medium' | 'hard'
},
```

Question counts on category cards update automatically.

Validate the data after editing questions:

```bash
npm run validate:data
```

---

## 🏗️ Adding Categories

1. Add questions with the new category name in `src/data/questions.ts`
2. Add an entry in `src/data/categories.ts`
3. Add a color entry in `src/theme/colors.ts` under `CategoryColors`

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
speedBonus:            proportional to time remaining / total time × 50
streakBonus:           +30 when streak ≥ 3 consecutive correct answers
```

---

## 💰 Monetization (Planned)

Placeholders exist in `settings.tsx`:

- Rewarded ad → Extra life
- Rewarded ad → Double coins
- Remove ads (premium)

Integrate with `react-native-google-mobile-ads` when ready.

---

## 📝 Notes

- All data stored locally — no internet required
- Daily challenge questions are date-seeded (same set for all players on a given day)
- Daily challenge selection uses a seeded Fisher-Yates shuffle and balances across categories
- `dailyCompleted` flag auto-resets at midnight via `getUserProfile()`
- Daily challenge results route back to the Daily screen instead of starting an invalid replay
- Leaderboard keeps top 50 entries sorted by score
- Quiz history keeps last 100 results
- Result records may include `answerMap`, a boolean array used by the result screen for exact answer breakdown dots
- Category play counts exclude the daily challenge so favourite category stays tied to regular categories

---

Built with ❤️ for Tanzania 🇹🇿 | v1.0.0
