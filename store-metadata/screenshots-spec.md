# Mtaa Quiz Battle Screenshot Specification

Capture final store imagery from the current native preview build. Do not use web screenshots for submission.

## Required Formats

### Google Play

- Portrait PNG or JPEG, 1080x1920 or 1080x2400.
- Keep each file under 8 MB.
- Provide at least four screenshots and one 1024x500 feature graphic.

### Apple App Store

- iPhone 6.9 inch: 1320x2868.
- iPhone 6.7 inch: 1290x2796.
- PNG, no marketing-only mockups that misrepresent the app.

## Recommended Sequence

| # | File | Screen and proof point |
| --- | --- | --- |
| 1 | `01-home.png` | Home showing Daily Challenge, personal focus, and daily missions |
| 2 | `02-categories.png` | All 10 category cards with search and difficulty filters |
| 3 | `03-quiz.png` | Swahili quiz question with timer, streak, score, and answer choices |
| 4 | `04-answer.png` | Answer reveal with explanation, category colour, and difficulty context |
| 5 | `05-results.png` | Result card with a newly unlocked achievement or answer-review control |
| 6 | `06-leaderboard.png` | Local, Global, or Mikoa leaderboard with real-looking test content |
| 7 | `07-profile.png` | Rank progress, achievements, and category mastery |
| 8 | `08-daily.png` | Daily Challenge streak and completion state |

## Capture Rules

- Use one consistent language per screenshot set. Capture a second language set only when a store asks for it.
- Use light or dark mode intentionally; make text, buttons, badges, and answer states readable.
- Hide personal email, test tokens, empty loading states, placeholder AdMob IDs, and debug UI.
- Use a fresh profile for the achievement screenshot so the result screen has a visible unlock.
- Use a realistic filled profile for leaderboard and profile screenshots.
- Re-capture any image after a UI, asset, ad, or IAP change that affects the pictured screen.

## Directory Layout

```text
store-metadata/screenshots/
  android/
    01-home.png
    02-categories.png
    03-quiz.png
    04-answer.png
    05-results.png
    06-leaderboard.png
    07-profile.png
    08-daily.png
    feature-graphic.png
  ios/
    01-home.png
    02-categories.png
    03-quiz.png
    04-answer.png
    05-results.png
    06-leaderboard.png
    07-profile.png
    08-daily.png
```

## Capture Workflow

```bash
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

Install each preview build on its target device or simulator, walk through the sequence above, and save files using the specified names.
