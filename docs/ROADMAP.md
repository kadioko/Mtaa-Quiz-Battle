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

- 626 bilingual questions across 10 categories (q001–q626).
- Optional `sourceNote` / `sourceUrl` metadata and `timeSensitive` / `reviewAfter` / `reviewReason` fields.
- Data validator (`scripts/validate-data.mjs`) checks IDs, categories, translations, options, answers, time-sensitive metadata, and daily challenge determinism.
- Comprehensive authoring guide (`docs/AUTHORING_GUIDE.md`) with per-category examples and batch injection tooling.

### Progression & Retention

- **10 player ranks** (Mgeni → Gwiji wa Bongo) based on total coins — shown as a banner with progress bar on profile.
- **27 achievements** auto-evaluated after every game (streaks, perfect rounds, accuracy, daily consistency, coins, category coverage, sprint, versus, challenges, practice).
- **Category mastery** — per-category accuracy bars on profile computed from full quiz history.
- **Recent game history** — last 10 games displayed as cards on profile.
- Coins earned every game (score-based + accuracy bonus); daily login reward scales with consecutive-day streak.

### Testing & Release Readiness

- **84 Jest tests** across 5 suites: scoring, daily challenge, storage migration, leaderboard filters, web/file smoke tests.
- `npm test` / `npm run test:ci` (with coverage) added to CI gate via `npm run check`.
- **EAS build profiles** in `eas.json`: `development`, `preview` (internal APK/IPA), `production` (AAB/IPA + autoIncrement + submit config).
- **Release checklist** (`docs/RELEASE_CHECKLIST.md`) covering code quality, versioning, assets, `app.json`, permissions, EAS builds, store metadata, question bank, localisation, and post-release steps.

### Sharing & Admin Tooling

- **Shareable result cards** — `react-native-view-shot` captures the score card as a PNG; `expo-sharing` shares it natively. Text-share fallback included.
- **Background music toggle** — `music` field added to `GameSettings`, separated from sound effects in settings UI and storage.
- **Admin review CLI** (`scripts/admin-review.mjs`) — interactive + flag-based: `--stats`, `--stale`, `--missing-en`, `--find <term>`, `--category`, `--difficulty`, `--export`. Run via `npm run admin:review`.

### Offline PWA & Notifications

- **Offline PWA** — `public/sw.js` service worker with cache-first (assets), stale-while-revalidate (shell), and network-first (external) strategies. `public/manifest.json` for installability. SW auto-registered on web startup in `_layout.tsx`.
- **Local push notifications** — `src/services/NotificationService.ts` wraps `expo-notifications`. Daily challenge reminder toggle in Settings; tapping a notification deep-links to `/daily`. Android channel configured.

### Monetisation Scaffolding

- **Rewarded ads** (`src/services/AdService.ts`) — `react-native-google-mobile-ads` integrated; `showRewardedAd('extra-life' | 'double-coins')` resolves with reward on success. Test IDs used in dev; real AdMob IDs needed before release.
- **Remove Ads IAP** (`src/services/IAPService.ts`) — `expo-in-app-purchases` integrated; `purchaseRemoveAds()`, `restorePurchases()`, `isAdFree()` (persisted to AsyncStorage). Real product IDs needed before release.
- Settings Premium section fully wired: Watch Ad buttons, Remove Ads purchase, Restore Purchases — no longer "coming soon" placeholders.

### Content Expansion ✅

**Goal achieved:** Every category now has ~50 questions (502 total, q001–q502).

- Review any `timeSensitive` questions whose `reviewAfter` date has passed (`npm run admin:review -- --stale`).
- Next content push (if desired): start at `q503` with `inject-batch6.mjs`.

### Multiplayer & Social (v1.1)

- **Versus 2–4 players** — same-device pass-and-play with handover screens and podium results.
- **Friend Challenges** — cross-device async multiplayer via 6-char share codes (Supabase REST `challenges` + `challenge_attempts` tables). Same questions for all participants, ranked standings.
- **Regional league (Mikoa)** — players pick their mkoa in Profile (31 regions); cloud scores aggregate into a regional leaderboard tab.

### Modes & Retention (v1.1)

- **Weekly Challenge** — week-seeded, medium/hard-biased 10 questions, once per week, Home banner.
- **Practice Mistakes** — self-cleaning pool of questions whose most recent answer was wrong.
- Smarter streak freeze (covers exactly one missed day), achievement trigger fixes, focus-refresh on Home/Daily.

### Tech Hardening (v1.1)

- `SoundService` with preloaded effects — single swap point for the expo-av → expo-audio migration.
- Notification cold-start deep links; accessibility roles/labels on core interactive components.
- Global leaderboard filter parity; region column on `leaderboard_entries`.

---

### Live Ops & Monetisation (v1.1)

- **Remote question delivery** — `question_packs` table + `QuestionSyncService` (validate → cache → merge). New content ships without app releases; daily/weekly remain bundled-only for determinism.
- **Live event windows** — `events` table; LIVE banner on Home during the window, seeded once-per-event quiz, scores on the global leaderboard under the event name.
- **Coin bundle IAPs** (200/600/1500, consumable) and **rewarded-ad coin top-ups** in the shop.

---

## Active / Next

1. **Replace placeholder IDs** — AdMob ad units (incl. new `free-coins`) and IAP product IDs (`mtaa_coins_200/600/1500`, remove-ads) in store consoles.
2. **expo-audio migration** — run `npx expo install expo-audio`, then swap the implementation inside `src/services/SoundService.ts` only.
3. **Ops maturity** — Sentry crash reporting, CI on push (`npm run check`), EAS Update for OTA fixes.
4. **Growth** — referral rewards on the challenge-code system, challenge deep links, anti-cheat Edge Function before prize events.

### Store Release Preparation

To ship v1.0 to Google Play and App Store:

1. **Replace placeholder IDs** in `app.json` and `src/services/AdService.ts` / `src/services/IAPService.ts` with real AdMob App IDs and IAP product IDs.
2. **Real assets** — replace `assets/icon.png`, `assets/splash.png`, `assets/adaptive-icon.png` with production 1024×1024 / correct-resolution artwork.
3. **`eas.json` submit config** — fill in `appleId`, `ascAppId`, `appleTeamId`, and provide `google-play-key.json`.
4. **Run full CI gate**: `npm run check`.
5. **EAS build + submit**: `eas build --platform all --profile production` → `eas submit`.
6. **Store metadata** — screenshots, descriptions (SW + EN), content rating, privacy policy URL.

---

## Later Backlog

### Online Features

- Cloud leaderboard with anonymous player IDs or optional sign-in (e.g. Firebase / Supabase).
- Optional cross-device progress sync tied to account.
- Real server-side push notifications (Expo Push Token + notification server for scheduled daily blasts).

### Gameplay & Content

- **Multiplayer mode** — real-time 1v1 or async challenge via room code.
- **Tournament mode** — weekly bracket-style competition across all categories.
- **Timed sprint mode** — answer as many questions as possible in 60 seconds.
- **Hints system** — spend coins to eliminate 2 wrong options or skip a question.
- **Streak freeze** — purchasable item to protect daily streak on a missed day.
- Periodic content refresh — add questions, retire stale ones, run `admin:review --stale`.

### UX & Polish

- **Onboarding flow** — brief tutorial for first-time players covering scoring, streaks, and daily challenge.
- **Animated category icons** — Lottie or Reanimated 3 entrance animations on category select screen.
- **Sound design expansion** — background music tracks per category (respects `music` toggle).
- **Haptic patterns** — distinct patterns for streak milestone, level-up, and achievement unlock.

### Monetisation (Post-Launch)

- **Coin shop** — purchasable coin packs as consumable IAPs.
- **Season pass** — monthly subscription unlocking bonus questions and exclusive category themes.
- **Rewarded ad placement on result screen** — "Watch ad to double coins from this round" button wired to `showRewardedAd('double-coins')` result-screen integration.

### Platform

- **Expo Web deployment** — host static PWA build (e.g. Netlify / Vercel) for browser play.
- **iPad / tablet layout** — two-column grid on wide screens.
- **Accessibility** — VoiceOver / TalkBack labels, larger touch targets, high-contrast mode.

---

## Quality Bar

Before merging any change:

```bash
npm run check
```

This runs: `tsc --noEmit` → `validate:data` → `check:contrast` → `jest --ci --coverage`.

For UI changes, also launch the app and inspect affected screens in both light and dark mode.
