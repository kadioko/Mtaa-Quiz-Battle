# 🇹🇿 Mtaa Quiz Battle

A Swahili-first Tanzanian trivia game built with **React Native + Expo**.

---

## 📱 Features

- **9 Screens**: Splash, Home, Categories, Quiz, Result, Leaderboard, Profile, Settings, Daily Challenge
- **10 Categories**: Bongo Fleva, Simba na Yanga, Mikoa, Historia, Vyakula, Methali, Mitaa ya Dar, Wanyama, Biashara, General Knowledge TZ
- **102+ Questions** in Swahili (with English translations)
- **Swahili / English** language toggle in Settings
- **Offline-first** — no backend required
- **Scoring**: Base +100, Speed bonus +50, Streak bonus +30
- **Daily Challenge** with daily streak tracking
- **Daily Login Reward** system
- **Local Leaderboard** (top 50 scores)
- **Profile & Stats** screen
- **Haptic feedback** on correct/wrong answers
- **Share score** via native share sheet
- **Monetization placeholders** for rewarded ads & premium

---

## 🚀 Setup & Installation

### 1. Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Android device or emulator (or Expo Go app)

### 2. Install dependencies

```bash
cd "Mtaa Quiz Battle"
npm install
```

### 3. Run on Android

```bash
npx expo start --android
```

Or scan the QR code with **Expo Go** after running:

```bash
npx expo start
```

### 4. Build APK (for distribution)

```bash
npx expo build:android
# or with EAS Build:
eas build --platform android --profile preview
```

---

## 📁 Project Structure

```
Mtaa Quiz Battle/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout + navigation
│   ├── index.tsx           # Splash screen
│   ├── home.tsx            # Home screen
│   ├── categories.tsx      # Category selection
│   ├── quiz.tsx            # Quiz gameplay
│   ├── result.tsx          # Results screen
│   ├── leaderboard.tsx     # Local leaderboard
│   ├── profile.tsx         # Player profile & stats
│   ├── settings.tsx        # App settings
│   └── daily.tsx           # Daily challenge
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── AnswerButton.tsx
│   │   ├── GradientBackground.tsx
│   │   ├── PrimaryButton.tsx
│   │   ├── StatCard.tsx
│   │   └── TimerBar.tsx
│   ├── data/               # Question bank & categories
│   │   ├── questions.ts    # 102+ questions
│   │   └── categories.ts   # 10 categories
│   ├── storage/            # AsyncStorage layer
│   │   └── storage.ts
│   ├── theme/              # Colors, typography, spacing
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   ├── types/              # TypeScript interfaces
│   │   └── index.ts
│   └── utils/
│       ├── gameLogic.ts    # Scoring, shuffling, ratings
│       ├── i18n.ts         # Swahili/English translations
│       └── LanguageContext.tsx
├── assets/                 # Icons & splash (add yours here)
├── app.json
├── babel.config.js
├── package.json
└── tsconfig.json
```

---

## ➕ How to Add More Questions

Edit `src/data/questions.ts` and add entries following this format:

```typescript
{
  id: 'q103',                          // unique ID
  category: 'General Knowledge TZ',   // must match a category name
  question: 'Swali lako hapa?',
  question_en: 'Your question here?',
  options: ['A', 'B', 'C', 'D'],
  options_en: ['A', 'B', 'C', 'D'],
  answer: 'B',
  answer_en: 'B',
  explanation: 'Maelezo ya Kiswahili.',
  explanation_en: 'English explanation.',
  difficulty: 'easy',  // 'easy' | 'medium' | 'hard'
},
```

The category question counts update automatically.

---

## 🏗️ Adding New Categories

1. Add questions with the new category name in `questions.ts`
2. Add a new entry in `src/data/categories.ts`
3. Add a color in `src/theme/colors.ts` under `CategoryColors`

---

## 🌍 Language System

- Toggle between **Kiswahili** and **English** in Settings
- All UI text goes through `t(key)` in `src/utils/i18n.ts`
- Questions have `question_en`, `options_en`, `answer_en`, `explanation_en` fields

---

## 💰 Monetization (Future)

Placeholders are in `settings.tsx`:

- Rewarded ad → Extra life
- Rewarded ad → Double coins
- Remove ads premium

Integrate with `react-native-google-mobile-ads` when ready.

---

## 📝 Notes

- All data is stored locally via `AsyncStorage`
- No internet required to play
- The daily challenge seed is based on the current date (same questions for everyone on the same day)
- Best scores and leaderboard entries are kept locally (top 50)

---

Built with ❤️ for Tanzania 🇹🇿
