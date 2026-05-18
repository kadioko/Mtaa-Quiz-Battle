# Mtaa Quiz Battle — Screenshots Specification

Minimum 4 screenshots required per platform. Suggested 6–8 for best conversion.

---

## Android (Google Play)

**Required size:** 1080 × 1920 px portrait (or 1080 × 2400 px for modern phones)
**Format:** PNG or JPEG, max 8 MB each

### Recommended Screens to Capture

| # | Screen | What to Show |
|---|--------|-------------|
| 1 | **Splash / Home** | Animated logo, "Chagua Mkundo" button, dark gradient background |
| 2 | **Category Select** | All 10 category cards with emoji, colours, coin cost |
| 3 | **Quiz in Progress** | Question text (Swahili), 4 answer buttons, timer bar, score, streak |
| 4 | **Answer Revealed** | Correct answer highlighted green, explanation text expanded |
| 5 | **Results Screen** | Score card: percentage, coins earned, XP, "Share" and "Review" buttons |
| 6 | **Leaderboard** | Top 10 list with player names, scores, ranks; local/global toggle |
| 7 | **Profile / Progression** | Player rank banner (e.g. "Jasiri"), achievement badges, mastery bars |
| 8 | **Daily Challenge** | Special header, streak counter, daily question UI |

**Feature Graphic (Play Store only):**
- Size: 1024 × 500 px
- Show the app logo + "Tanzania's #1 Trivia Game" tagline + Tanzanian flag colours
- Format: PNG or JPEG

---

## iOS (App Store)

**Required sizes:**
- iPhone 6.9" (iPhone 16 Pro Max): 1320 × 2868 px
- iPhone 6.7" (iPhone 15 Plus): 1290 × 2796 px
- iPad 13" (optional): 2048 × 2732 px

**Format:** PNG, max 500 MB

### Recommended Screens (same content as Android)

Capture the same 6–8 screens listed above at iOS dimensions.

iOS allows **App Preview videos** (15–30 sec MP4). Consider recording:
- Quiz gameplay showing a correct + wrong answer
- Achievement unlock animation
- Category select to question flow

---

## Screenshot Capture Workflow

### Option A: Expo Go / Simulator
```bash
# Run app on Android emulator
npm run android

# Take screenshot from emulator
# Android: Press Ctrl+S in emulator window
# Save to store-metadata/screenshots/android/
```

### Option B: Physical Device
- Install the preview build: `eas build --platform android --profile preview`
- Screenshot each screen manually
- Transfer files to `store-metadata/screenshots/`

### Option C: Design Tool
- Use Figma / Canva with device frames
- Import actual screenshots and overlay on device mockups
- Export at required resolution

---

## Text Overlay Tips (Optional)

Add short captions in both Swahili and English:
- Screen 1: "Cheza na Ujifunze / Play & Learn"
- Screen 2: "Makundi 10 / 10 Categories"
- Screen 3: "Swali la Kila Siku / Daily Challenge"
- Screen 4: "Chunguza Majibu / Explore Answers"
- Screen 5: "Fuatilia Maendeleo / Track Progress"

---

## Output Directory Structure

```
store-metadata/
  screenshots/
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
