# Mtaa Quiz Battle — Release Checklist

Use this checklist before every public release (Play Store / App Store / web).
Check off each item in order. Do not submit until all boxes are ticked.

---

## 1. Code Quality

- [ ] `npm run typecheck` exits with 0 errors
- [ ] `npm run validate:data` exits with 0 errors (no missing fields, no bad IDs)
- [ ] `npm run check:contrast` exits with 0 contrast violations
- [ ] `npm test -- --forceExit` — all tests pass (87 tests, 5 suites)
- [ ] No `console.log` / `console.warn` left in production code (grep: `console\.log`)
- [ ] No hardcoded TODO/FIXME in source files shipped to users

---

## 2. Versioning

- [ ] `app.json` → `expo.version` bumped (semver: major.minor.patch)
- [ ] `app.json` → `expo.android.versionCode` incremented by 1 from previous release
- [ ] `package.json` → `version` matches `app.json` version
- [ ] Git tag created: `git tag v<version>` and pushed: `git push --tags`
- [ ] Commit message follows convention: `release: v<version>`

---

## 3. Assets

- [ ] `assets/icon.png` — 1024×1024 px, no transparency, no rounded corners (stores add them)
- [ ] `assets/splash.png` — 1242×2436 px (portrait), background `#1A1A2E`, centered logo
- [ ] `assets/adaptive-icon.png` — 1024×1024 px foreground layer with safe-zone padding
- [ ] `assets/favicon.png` — 196×196 px, used for web PWA
- [ ] All asset files are ≤ 1 MB uncompressed
- [ ] No placeholder/default Expo assets remain (icon, splash must be custom)

---

## 4. App Configuration (`app.json`)

- [ ] `expo.name` = "Mtaa Quiz Battle" (exactly as shown in stores)
- [ ] `expo.slug` = "mtaa-quiz-battle" (never change after first publish)
- [ ] `expo.ios.bundleIdentifier` = `com.mtaaquiz.battle`
- [ ] `expo.android.package` = `com.mtaaquiz.battle`
- [ ] `expo.orientation` = `"portrait"` (locked)
- [ ] `expo.userInterfaceStyle` = `"dark"`
- [ ] `expo.scheme` = `"mtaaquiz"` (deep-link scheme)
- [ ] `expo.plugins` list is complete: `["expo-router","expo-font","expo-sharing"]`

---

## 5. Permissions

- [ ] No unnecessary permissions declared in `app.json` or native manifests
- [ ] Android: no `READ_EXTERNAL_STORAGE` or `WRITE_EXTERNAL_STORAGE` unless required
- [ ] iOS: `NSMicrophoneUsageDescription` and `NSCameraUsageDescription` **not** present (app does not use them)
- [ ] `expo-av` audio permissions: only `AUDIO_PLAYBACK` needed (no recording)
- [ ] `expo-sharing` does not require additional manifest entries

---

## 6. EAS Build

### Preview Build (internal testers)
```
eas build --platform all --profile preview
```
- [ ] Android APK builds without errors
- [ ] iOS IPA builds without errors (or simulator build passes)
- [ ] Install APK on a physical Android device and smoke-test all 15 screens (incl. sprint, versus, challenge, shop, signin)
- [ ] Versus: complete a 3-player match end-to-end (handover + podium)
- [ ] Friend Challenge: create on one device, join with the code on another, verify standings
- [ ] Verify adaptive difficulty activates after required game count
- [ ] Verify daily challenge changes date at midnight
- [ ] Verify profile shows rank, achievements, mastery, history cards

### Production Build
```
eas build --platform all --profile production
```
- [ ] Build completes with `autoIncrement` applied
- [ ] Android: `.aab` bundle generated
- [ ] iOS: `.ipa` archive generated
- [ ] Bundle size within store limits (Android ≤ 150 MB, iOS ≤ 4 GB)
- [ ] No debug symbols or dev-mode code in production bundle

---

## 7. Store Metadata

### Both Stores
- [ ] App name: **Mtaa Quiz Battle**
- [ ] Short description (≤ 80 chars): "Jaribu ujuzi wako wa Tanzania! Maswali 222+ kutoka makundi 10."
- [ ] Long description written in both Swahili and English
- [ ] Category: **Trivia / Education**
- [ ] Content rating: **Everyone** (no violence, no adult content)
- [ ] Privacy Policy URL provided (required by both stores)
- [ ] At least 4 screenshots per platform (portrait, 1080×1920 or better)
- [ ] Feature graphic (Play Store): 1024×500 px

### Google Play
- [ ] App signed with upload key (not debug keystore)
- [ ] Release track: **Internal** → **Closed Testing** → **Production**
- [ ] Data safety form completed (AsyncStorage: no data sent off-device)
- [ ] Target SDK ≥ 34 (required from Aug 2024)

### Apple App Store
- [ ] Bundle ID registered in App Store Connect
- [ ] Provisioning profile valid and not expired
- [ ] Age rating questionnaire completed (4+)
- [ ] In-app purchases declared (Remove Ads; coin bundles if enabled) with localized descriptions

---

## 7b. Cloud Backend (if cloud features enabled)

- [ ] All tables from `docs/CLOUD_SETUP.md` created, including `challenges`, `challenge_attempts`, and the `leaderboard_entries.region` column
- [ ] RLS policies applied to every table
- [ ] `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` set as EAS secrets
- [ ] Push worker cron configured (GitHub Actions or equivalent)
- [ ] Smoke-test: submit a score, fetch global + Mikoa leaderboards, create/join a challenge

---

## 8. Question Bank

- [ ] `npm run validate:data` reports 0 errors across all questions
- [ ] All `timeSensitive: true` questions have `sourceNote` and `sourceUrl`
- [ ] No duplicate question IDs (`q001`–`q626`)
- [ ] Each category has ≥ 10 questions (validator enforces this)
- [ ] `reviewAfter` dates checked — remove or update any past-due reviews

---

## 9. Localisation

- [ ] All new UI strings added to both `sw` and `en` in `src/utils/i18n.ts`
- [ ] No English text hard-coded in JSX outside of `i18n.ts`
- [ ] Default language is `sw` (Swahili)
- [ ] Language switcher tested: full app re-renders correctly in English

---

## 10. Post-Release

- [ ] Tag pushed to GitHub: `git push --tags`
- [ ] `CHANGELOG.md` (or release notes in GitHub) updated with this version's changes
- [ ] Monitor Play Store / TestFlight crash reports for 48 hours after rollout
- [ ] Increment `versionCode` in `app.json` committed for next release cycle
