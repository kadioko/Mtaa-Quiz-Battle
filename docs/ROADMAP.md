# Mtaa Quiz Battle Roadmap

## Product Direction

Mtaa Quiz Battle is a Swahili-first Tanzanian trivia game focused on quick sessions, local culture, repeat play, and offline reliability. The near-term goal is to make the app feel polished, trustworthy, and easy to extend before adding online or monetized features.

## Recently Completed

- Upgraded to Expo SDK 55 with React 19 and React Native 0.83.
- Added strict TypeScript and data validation checks through `npm run check`.
- Added a data validator for question integrity, category links, translation parity, and daily challenge determinism.
- Improved quiz result records with per-question answer maps.
- Fixed daily challenge replay routing and invalid quiz/category recovery states.
- Added fair Fisher-Yates question shuffling and category-balanced daily challenges.
- Hardened AsyncStorage parsing and leaderboard sorting.
- Improved Home, Settings, and Leaderboard localization.
- Added persisted light/dark appearance settings and a theme provider foundation.

## Next Priorities

### 1. Complete Theme Coverage

**Status:** In progress  
**Goal:** Make light/dark mode consistent across every screen.

Remaining work:

- Convert Categories, Quiz, Result, Daily, Profile, and Leaderboard styles to live theme tokens.
- Update reusable components (`PrimaryButton`, `AnswerButton`, `StatCard`, `TimerBar`) to consume theme context.
- Add visual checks for light and dark mode on mobile-width and desktop-width web.
- Confirm contrast ratios for text, disabled controls, badges, and answer states.

### 2. Improve Gameplay Polish

**Status:** Planned  
**Goal:** Make every quiz feel fair, responsive, and satisfying.

Remaining work:

- Add a pause/quit confirmation that preserves score display cleanly.
- Add review mode after results so players can inspect missed questions.
- Improve answer explanation UI with category color and difficulty context.
- Add better feedback for time-up answers.
- Consider adaptive difficulty once enough local history exists.

### 3. Content Quality Expansion

**Status:** In progress  
**Goal:** Increase replay value while keeping data accurate.

Remaining work:

- Continue growing each category toward 30-50 questions.
- Add source notes to more fact-sensitive existing questions.
- Continue flagging time-sensitive questions, such as current leaders or active records, for scheduled review.
- Expand the authoring guide with examples from every category as the bank grows.

Completed foundation:

- Added optional source metadata and time-sensitive review fields to questions.
- Added validator checks for time-sensitive question metadata.
- Added a question authoring guide with examples and validation rules.
- Added the first balanced expansion batch across all categories.

### 4. Progression And Retention

**Status:** Planned  
**Goal:** Give players meaningful reasons to return.

Remaining work:

- Add levels or ranks based on total coins and accuracy.
- Add achievements for streaks, perfect rounds, category mastery, and daily consistency.
- Add profile history cards for recent games.
- Add category mastery percentages.

### 5. Testing And Release Readiness

**Status:** Planned  
**Goal:** Make the app safer to ship.

Remaining work:

- Add unit tests for scoring, daily challenge selection, storage migration, and leaderboard filters.
- Add a lightweight smoke test for web routing.
- Add EAS build profiles for preview and production.
- Add release checklist covering assets, permissions, versioning, and store metadata.

## Later Backlog

- Cloud leaderboard with auth or anonymous player IDs.
- Optional account sync across devices.
- Rewarded ads and premium remove-ads flow.
- Push notification reminders for daily challenges.
- Shareable result cards as generated images.
- Admin tooling for reviewing and importing question packs.
- Audio/music settings split between effects and background music.

## Quality Bar

Before merging meaningful changes:

```bash
npm run check
```

For UI changes, also run the app and inspect the affected screens in both appearance modes.
