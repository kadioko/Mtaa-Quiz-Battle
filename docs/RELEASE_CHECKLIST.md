# Mtaa Quiz Battle Release Checklist

Use this checklist before every Play Store, App Store, or web release. Release only when every applicable item is complete.

For the exact Android build and Google Play submission commands, use `docs/ANDROID_RELEASE_BUILD.md`.

## 1. Quality Gate

- [ ] `npm run check` exits with code 0.
- [ ] `npm run release:check` exits with code 0.
- [ ] 95 or more Jest tests pass across all suites.
- [ ] No production `console.log`, `console.warn`, TODO, or FIXME remains without an owner.
- [ ] New UI is checked in light and dark mode at mobile and desktop web widths.
- [ ] Quiz, result review, daily missions, achievement celebration, settings, and offline startup are smoke-tested on a native preview build.

## 2. Versioning

- [ ] `app.json` version is bumped using semantic versioning.
- [ ] Android `versionCode` is incremented.
- [ ] `package.json` version matches `app.json`.
- [ ] `CHANGELOG.md` has an entry for the release.
- [ ] Release commit and annotated Git tag are created and pushed.

## 3. Store Assets and Configuration

- [ ] `assets/icon.png` is final 1024x1024 artwork with no rounded corners or transparency.
- [ ] `assets/splash.png`, `assets/adaptive-icon.png`, and `assets/favicon.png` are final artwork, not Expo placeholders.
- [ ] `app.json` name, slug, Android package, iOS bundle ID, scheme, permissions, and plugins are correct.
- [ ] AdMob uses real Android and iOS app IDs plus real rewarded ad-unit IDs; development test IDs are never shipped.
- [ ] `expo-audio` playback works on Android and iOS without a microphone permission prompt.

## 4. Purchases and Ads

- [ ] Play Console product `mtaa_remove_ads` is active and matches the Android client configuration.
- [ ] App Store Connect product `com.mtaaquiz.battle.removeads` is active and matches the iOS client configuration.
- [ ] Coin-bundle products are either active and tested or hidden from the production build.
- [ ] Purchase, restore, and ad reward paths are tested with store sandbox accounts.

## 5. Cloud and Notifications

- [ ] All tables and RLS policies in `docs/CLOUD_SETUP.md` are applied.
- [ ] `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set in EAS.
- [ ] GitHub secrets `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set for the keepalive workflow.
- [ ] A manual keepalive run returns HTTP 200.
- [ ] A REST probe for `leaderboard_entries` returns HTTP 200; a health check alone does not prove schema setup.
- [ ] Global, Mikoa, sync, friend challenge, and offline fallback paths are smoke-tested.
- [ ] Push notifications and their deep links are tested on a physical device.

## 6. EAS Credentials and Builds

- [ ] `eas.json` has correct Apple `appleId`, `ascAppId`, and `appleTeamId` values.
- [ ] `google-play-key.json` is stored locally, excluded from Git, and accepted by EAS submit.
- [ ] Preview Android and iOS builds install successfully.
- [ ] Production AAB and IPA build successfully with auto-incremented versions.
- [ ] All 15 routes are smoke-tested, including sprint, versus, challenge, shop, sign-in, and onboarding.

## 7. Content

- [ ] `npm run validate:data` reports no errors across `q001` through `q626` and any remote-pack fixtures.
- [ ] All time-sensitive questions have source notes, source URLs, review dates, and review reasons.
- [ ] `npm run admin:review -- --stale` has no unresolved stale facts.
- [ ] New questions are bilingual, have four unique options per language, and keep category difficulty balance healthy.

## 8. Store Submission

- [ ] English and Swahili listings are current in `store-metadata/`.
- [ ] Privacy policy is hosted publicly and the exact URL is in both listings.
- [ ] Data safety and age-rating answers match enabled ads, purchases, notifications, and cloud features.
- [ ] Native screenshots follow `store-metadata/screenshots-spec.md` and use the latest preview build.
- [ ] Google Play launch path is Internal, Closed testing, then Production.
- [ ] App Store privacy, age rating, and IAP metadata are complete.

## 9. After Release

- [ ] Verify purchase, ad, notification, global leaderboard, and crash-reporting telemetry.
- [ ] Monitor store reviews and crash reports for 48 hours.
- [ ] Record the production build number and release date in the changelog.
