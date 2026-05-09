# Mtaa Quiz Battle — Roadmap

## Product Direction

Mtaa Quiz Battle is a Swahili-first Tanzanian trivia game focused on quick sessions, local culture, repeat play, and offline reliability. The near-term goal is a polished, store-ready v1.0 before adding online or monetised features.

---

## Completed

### Foundation
- Expo SDK 55, React 19, React Native 0.83, TypeScript strict mode throughout.
- Expo Router v3 file-based navigation; all 9 screens implemented.
- Offline-first: zero backend, all state in AsyncStorage.
- `npm run check` CI gate: typecheck + data validation + contrast check + tests.

### Theme & Visual Polish
- Full light/dark theme system via `useThemeColors()` — all screens and components themed.
- Themed animated splash screen (`index.tsx`) with gradient and pulsing dots.
- WCAG contrast checker script (`scripts/check-contrast.mjs`).
- All reusable components (`PrimaryButton`, `AnswerButton`, `StatCard`, `TimerBar`) consume theme tokens.

### Gameplay Polish
- Pause / quit confirmation modal during a quiz.
- Review mode on result screen — inspect every question with the correct answer highlighted.
- Improved answer explanation UI with category colour and difficulty context.
- Timeout feedback — clear visual + haptic cue when the timer expires.
- Adaptive difficulty — after ≥30 games and ≥200 answered questions, question selection biases toward the player's weak difficulty tier per category without affecting Daily Challenge fairness.

### Content Quality
- 302 bilingual questions across 10 categories (q001–q302, 30 per category minimum reached).
- Optional `sourceNote` / `sourceUrl` metadata and `timeSensitive` / `reviewAfter` / `reviewReason` fields.
- Data validator (`scripts/validate-data.mjs`) checks IDs, categories, translations, options, answers, time-sensitive metadata, and daily challenge determinism.
- Comprehensive authoring guide (`docs/AUTHORING_GUIDE.md`) with per-category examples and batch injection tooling.

### Progression & Retention
- **9 player ranks** (Mgeni → Hadithi) based on total coins — shown as a banner with progress bar on profile.
- **17 achievements** auto-evaluated after every game (streaks, perfect rounds, accuracy, daily consistency, coins, category coverage).
- **Category mastery** — per-category accuracy bars on profile computed from full quiz history.
- **Recent game history** — last 10 games displayed as cards on profile.
- Coins earned every game (score-based + accuracy bonus); daily login reward scales with consecutive-day streak.

### Testing & Release Readiness
- **84 Jest tests** across 5 suites: scoring, daily challenge, storage migration, leaderboard filters, web/file smoke tests.
- `npm test` / `npm run test:ci` (with coverage) added to CI gate via `npm run check`.
- **EAS build profiles** in `eas.json`: `development`, `preview` (internal APK/IPA), `production` (AAB/IPA + autoIncrement + submit config).
- **Release checklist** (`docs/RELEASE_CHECKLIST.md`) covering code quality, versioning, assets, `app.json`, permissions, EAS builds, store metadata, question bank, localisation, and post-release steps.

---

## Active / Next

### Content Expansion
**Goal:** Bring every category to 30–50 questions for strong replay depth.

- Current: **30 questions per category** (q001–q302). ✅ Minimum depth reached.
- Next batch starts at `q303`. Target remains 50 questions per category.
- Add balanced batches across all 10 categories using `scripts/inject-batch3.mjs` (create when ready).
- Continue flagging time-sensitive questions (`timeSensitive: true`) with `reviewAfter` dates.
- Review any `reviewAfter` dates that have passed.

---

## Later Backlog

- Cloud leaderboard with anonymous player IDs or optional sign-in.
- Optional cross-device progress sync.
- Rewarded ads → extra life or double coins; premium remove-ads IAP.
- Push notification reminders for daily challenges.
- Shareable result cards as generated images (not just text share).
- Admin tooling for bulk question review and import.
- Background music toggle separate from sound effects.
- Offline PWA support (web service worker).

---

## Quality Bar

Before merging any change:

```bash
npm run check
```

This runs: `tsc --noEmit` → `validate:data` → `check:contrast` → `jest --ci --coverage`.

For UI changes, also launch the app and inspect affected screens in both light and dark mode.
