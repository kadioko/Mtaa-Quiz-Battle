# Changelog

## Unreleased

### Player Experience
- Home now provides a personalised focus: practice unresolved mistakes, train a weak category, or explore a new one.
- Added three claimable daily missions for rounds played, correct answers, and answer streaks.
- Results now celebrate each achievement unlocked by the completed round with its name and explanation.

### Platform and Quality
- Upgraded the Expo SDK 55 dependency set and migrated sound and music playback to `expo-audio`.
- Added recommendation, mission, and achievement-result coverage; the suite now has 95 tests across 6 suites.

### Documentation
- Updated the roadmap, release checklist, Android release-build runbook, content authoring standards, cloud setup, store descriptions, privacy notes, and screenshot plan to match v1.1.0.

## [1.1.0] — Unreleased (June 2026)

### New Game Modes
- **Versus 2–4 players** — pass-and-play upgraded from fixed 2 players to 2–4, with player-count picker, per-player names/icons, handover screens, and a ranked podium.
- **Friend Challenge (cross-device)** — create a challenge, get a 6-char share code, friends play the *same questions* on their own phones; ranked standings with refresh. Supabase REST, no realtime connection needed.
- **Weekly Challenge** — 10 medium/hard questions, identical for everyone all week (seeded by week key), once per week, with Home banner.
- **Practice Mistakes** — auto-built quiz from questions whose most recent answer was wrong; questions leave the pool once answered correctly.

### Regional League
- Pick your mkoa (all 31 regions) in Profile.
- Scores submit with region; new **Mikoa** leaderboard tab aggregates total points per region.

### Content
- +24 new bilingual questions (q603–q626) across 8 categories → 626 total.

### Progression
- New rank: **Gwiji wa Bongo 🐐** (level 10, 8 000 coins).
- New achievements: 1000 Coins 🏦, Played 250 🎖️, Redemption 🧠 (perfect practice round), Challenger 🏁 (play a friend challenge) → 27 total.

### Fixes
- Versus: crash when a player's timer expired (stale closure captured an empty question list).
- Quiz: timer could be permanently stopped by opening and cancelling the quit dialog (hardware back).
- Daily streak no longer resets if the daily challenge completes twice in one day.
- Streak Freeze now only covers exactly one missed day (previously survived any gap).
- `freeze_used` achievement now unlocks when a freeze is actually consumed, not on purchase.
- `streak_3`/`streak_7` achievements now evaluate in-game question streaks as described (was day streaks).
- Practice/weekly results no longer pollute category stats, favourite category, or the all-categories achievement.
- Daily screen: streak dots no longer wrap to zero at a 7-day streak; screen refreshes on focus.
- Home screen stats refresh on focus (were stale after finishing a game).
- Review items map the selected answer across languages correctly.
- Global leaderboard now respects All/Daily/Best filter tabs.
- Fixed corrupted emoji in result share text and Settings notifications header.

### Remote Content & Live Ops
- **Remote question delivery** — publish question packs to the Supabase `question_packs` table; the app validates, caches, and merges them at startup. New content without app releases. Daily/weekly stay bundled-only for cross-device determinism.
- **Live events** — time-boxed special challenges (`events` table): a 🔴 LIVE banner appears on Home during the window, everyone plays the same seeded questions once, scores hit the global leaderboard under the event name.

### Monetization
- **Coin bundles** — three consumable IAPs (200/600/1500 coins) in the shop; coins credited via the purchase listener with consume-on-finish.
- **Watch-ad for coins** — rewarded ad in the shop grants +20 coins (new `free-coins` ad unit type).

### Technical
- New `SoundService`: sound effects preloaded once at app start (replaces 3 duplicated loaders); single file to swap when migrating from deprecated expo-av to expo-audio.
- Notification cold-start deep link (app launched from a tapped reminder → daily challenge).
- Accessibility: roles/labels/states on answer buttons, primary buttons, and Home nav cards.
- +3 Jest tests covering new achievement semantics (87 total).
- New Supabase tables: `challenges`, `challenge_attempts`; `leaderboard_entries.region` column (see docs/CLOUD_SETUP.md).

## [1.0.0]

Initial release: 10 categories, classic/daily/sprint/versus modes, ranks, achievements, coins, hints, streak freezes, light/dark themes, sw/en localisation, offline PWA, local notifications, cloud leaderboard + sync scaffolding.
