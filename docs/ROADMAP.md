# Mtaa Quiz Battle Roadmap

## Product Snapshot

Mtaa Quiz Battle is a Swahili-first, local-first Tanzanian trivia game. Version 1.1.0 has 626 bilingual questions, 15 app routes, 7 play modes, 10 ranks, 27 achievements, personal training recommendations, daily missions, and optional Supabase cloud features.

The goal is not to add features at random. The next releases should deepen repeat play, make content easy to operate, and remove the remaining store-release blockers.

## Shipped

### Core game

- 626 bilingual questions across 10 categories (`q001` through `q626`).
- Classic, Daily Challenge, Weekly Challenge, Sprint, Versus, Friend Challenge, and Practice Mistakes modes.
- Three difficulty tiers, timed scoring, streak and speed bonuses, adaptive difficulty, answer explanations, pause/quit confirmation, and result review.
- Light and dark themes using shared theme tokens in screens and reusable controls.

### Player loop

- Coins, daily login rewards, rank progress, category mastery, history, and 27 achievements.
- A Home focus card that recommends practice mistakes, a weak category, or an unplayed category from local history.
- Three daily missions: complete two rounds, answer 12 correctly, and reach a five-answer streak. Rewards can be claimed once per day.
- New achievements are shown with their title and explanation immediately after the game that earned them.

### Social and cloud

- Local leaderboard plus optional Supabase global and regional leaderboards.
- Regional league support for all 31 Tanzanian regions.
- Magic-link sign-in, optional progress sync, friend challenges, remote question packs, and live event windows.
- GitHub Actions keepalive checks Supabase health three times weekly. It keeps a configured project active but does not replace schema verification.

### Quality and delivery

- Expo SDK 55, React 19, React Native 0.83, TypeScript strict mode, and `expo-audio`.
- `npm run check` runs typecheck, question validation, contrast checks, and Jest coverage tests.
- 95 Jest tests across 6 suites.
- Question authoring rules, release checklist, cloud setup, store text, privacy policy, and screenshot guidance are maintained in this repository.

## Next Release Priorities

### 1. Store release blockers

1. Replace placeholder AdMob app and rewarded-unit IDs in `app.json` and `src/services/AdService.ts`.
2. Register and test the Play Store and App Store IAP products.
3. Apply the Supabase schema from `docs/CLOUD_SETUP.md`, then verify the leaderboard REST endpoint returns HTTP 200.
4. Replace the four placeholder artwork assets and capture final native screenshots from preview builds.
5. Fill Apple submit fields in `eas.json`, add the Google service account key locally, and publish the privacy-policy URL.

### 2. Content operations

1. Use `scripts/admin-review.mjs` to review stale and time-sensitive questions before each content pack.
2. Publish small remote packs weekly after human review; use `r###` IDs so they cannot collide with bundled content.
3. Build a moderation workflow before accepting community-submitted questions.
4. Grow toward 5,000 reviewed questions while preserving category balance and bilingual quality.

### 3. Retention and competition

1. Launch calendar-based event packs for Ramadan, Uhuru Day, CHAN, and AFCON.
2. Add weekly regional league summaries and a shareable region-progress card.
3. Add scheduled challenge windows with a common leaderboard before building real-time multiplayer.
4. Validate airtime or bundle rewards with a compliant Tanzania provider before announcing prizes.

### 4. Observability and resilience

1. Add crash reporting and privacy-safe gameplay analytics.
2. Add EAS Update for small post-release fixes.
3. Keep CI required on every pull request and add native smoke tests for preview builds.
4. Split the bundled question data only when load time or merge conflicts justify it.

## Later Bets

- Swahili text-to-speech for questions and explanations.
- A high-contrast accessibility option and larger text controls.
- Referral rewards tied to friend challenges.
- A season pass only after the free content loop and ads are reliable.

## Quality Bar

Before merging a gameplay, content, storage, or UI change:

```bash
npm run check
```

For UI changes, inspect the affected flows in light and dark mode at mobile and desktop web widths. For cloud changes, test both an unconfigured offline path and the configured Supabase path.
