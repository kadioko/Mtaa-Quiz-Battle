# Android Release Build Guide

This runbook creates, verifies, and submits the Android production build for Mtaa Quiz Battle. It is the Android-specific companion to `docs/RELEASE_CHECKLIST.md`.

## What This Project Builds

The `production` profile in `eas.json` creates a signed Android App Bundle (`.aab`):

- Package name: `com.mtaaquiz.battle`
- Build profile: `production`
- Artifact: Android App Bundle (`app-bundle`)
- Versioning: EAS auto-increments `expo.android.versionCode`
- Submission track: Google Play Internal testing
- Safety guard: EAS requires the worktree to be committed before it starts

An `.aab` is for Google Play submission. Use the `preview` profile when you need an installable `.apk` for tester devices.

## One-Time Setup

Complete these items before the first production submission:

1. Create the app in Google Play Console with package name `com.mtaaquiz.battle`.
2. Create a Google service account in Play Console API access, grant the required app access, and download its JSON key as `google-play-key.json` in the repository root. This file is already ignored by Git.
3. Upload the service-account key in EAS credentials, or keep the local path configured in `eas.json` for interactive submission.
4. Replace the placeholder Android AdMob app ID and rewarded ad-unit IDs before building for public testing.
5. Confirm `mtaa_remove_ads` is registered in Play Console if the Remove Ads purchase is enabled, and that it is configured as a non-consumable entitlement.
6. Do not enable paid coin bundles until a trusted backend verifies purchase receipts before coins are granted.
7. Add the public privacy-policy URL, store listing, Data Safety answers, and required screenshots in Play Console.
7. Sign in to EAS:

```bash
npm install --global eas-cli
eas login
```

## Pre-Build Gate

From the project root, run:

```bash
npm run check
npm run release:check
git status --short
```

Both checks must pass. `git status --short` must be empty before a production build because this repository has `requireCommit: true` in `eas.json`.

Before the first store release, also confirm:

- Final icon, splash, adaptive icon, and favicon are in `assets/`.
- `app.json` version is the intended marketing version.
- Supabase schema, cloud secrets, and production notifications are configured if those features are being shipped.
- A preview APK has been installed and smoke-tested on a physical Android device.

## Build a Preview APK

Use this for testers and final native screenshot capture. Do not upload this APK to Google Play.

```bash
eas build --platform android --profile preview
```

Install the generated APK and test onboarding, a quiz round, result review, achievement celebration, daily missions, theme switching, direct-link replay protection, purchases, ads, notifications, and offline launch.

## Build the Production AAB

Create the store artifact:

```bash
eas build --platform android --profile production
```

EAS creates a signed `.aab` and increments Android `versionCode` automatically. Wait for the build to finish, then open the EAS build page and confirm the profile is `production`, the artifact is an Android App Bundle, and the version code is higher than the last Play Console upload.

If the production build fails, keep the build URL and fix the logged error before retrying. Do not upload a preview APK as a substitute.

## Submit to Google Play Internal Testing

After a successful production build:

```bash
eas submit --platform android --profile production
```

Choose the production AAB when prompted. The configured submission profile uploads to the `internal` track using `./google-play-key.json`.

For a deliberately manual upload, download the `.aab` from EAS and create an Internal testing release in Google Play Console. Upload the bundle, add release notes, save, and publish to the internal track.

## Play Console Promotion

1. Open Internal testing and confirm the new version code and package name.
2. Add testers and share the opt-in link.
3. Install from Google Play on at least one real device and repeat the release smoke test.
4. Resolve pre-launch report warnings that affect functionality, policy, or stability.
5. Promote the same approved bundle to Closed testing, then Production when store listing, policy, and testing requirements are complete.

## Rollback and Recovery

- Do not reuse a submitted Android version code; build again with the production profile.
- Halt or replace a bad release in Play Console rather than deleting local signing material.
- Keep `google-play-key.json`, upload credentials, and the Play Console account private. Never commit the JSON key or paste it into chat, issue trackers, or source files.
- Record the final version, version code, EAS build URL, Play release URL, and release date in `CHANGELOG.md`.

## Useful Commands

```bash
# Inspect the active Expo account and project linkage
eas whoami
eas project:info

# Configure or replace Android service credentials
eas credentials --platform android

# Submit the latest successful Android build non-interactively after CI setup
eas submit --platform android --profile production --latest --non-interactive
```
