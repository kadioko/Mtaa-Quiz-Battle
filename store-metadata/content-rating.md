# Mtaa Quiz Battle — Content Rating Questionnaire Answers

Use these answers when filling in the content rating questionnaire on Google Play Console and App Store Connect.

---

## Google Play — Content Rating (IARC)

**App Category:** Game → Trivia

| Question | Answer |
|----------|--------|
| Does the app contain violence? | No |
| Does the app contain sexual content? | No |
| Does the app contain profanity or crude humour? | No |
| Does the app contain controlled substances or drugs? | No |
| Does the app simulate gambling? | No |
| Does the app allow users to communicate with other users? | No (leaderboard shows anonymised display names only) |
| Does the app allow users to share personal information? | No |
| Does the app contain any user-generated content? | No |
| Is the app a digital marketplace? | No |
| Does the app have in-app purchases? | Yes (Remove Ads) |
| Is the app primarily directed to children under 13? | No |

**Expected Rating:** Everyone (E) / PEGI 3

---

## Apple App Store — Age Rating (App Store Connect)

Navigate to App Store Connect → Your App → App Information → Age Rating

| Category | Level |
|----------|-------|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Sexual Content or Nudity | None |
| Profanity or Crude Humour | None |
| Mature/Suggestive Themes | None |
| Horror/Fear Themes | None |
| Medical/Treatment Information | None |
| Alcohol, Tobacco, or Drug Use or References | None |
| Gambling and Contests | None |
| Unrestricted Web Access | None |
| Social Networking | None |

**Expected Rating:** 4+

---

## Data Safety (Google Play)

### Data collected
- None collected by this app directly

### Data shared with third parties
- **AdMob** (Google): Advertising ID for ad personalisation (if user has not purchased Remove Ads). Governed by Google's privacy policy.
- **Supabase** (optional cloud): Anonymised player ID + display name + score. No email unless user signs in with magic link.

### Data storage
- **On-device only**: All quiz progress, achievements, leaderboard scores stored in AsyncStorage (no cloud sync unless user opts in).
- **Optional cloud**: Scores and progress synced to Supabase if user taps "Sync Now".

### Data security
- Data in transit encrypted via HTTPS/TLS.
- No sensitive personal data (no SSN, payment info, precise location).

### Data deletion
- User can clear all local data via device app settings (Clear Data).
- Cloud data deletion: contact mtaaquiz@example.com.

---

## Privacy Policy URL

**Required by both stores.** You must host a privacy policy before submission.

Suggested URL after GitHub Pages or another static host is enabled: `https://kadioko.github.io/Mtaa-Quiz-Battle/privacy.html`

Minimum required content:
1. What data is collected (AdMob advertising ID, optional anonymised cloud ID)
2. How data is used (ad delivery, optional cloud leaderboard)
3. Third-party services (Google AdMob, Supabase)
4. User rights (opt-out of ads by purchasing Remove Ads; opt-out of cloud by not syncing)
5. Contact information for data requests

---

## Notes for Reviewer

- App is a general knowledge trivia game about Tanzania.
- No user-generated content; all questions are authored by the developer.
- In-app purchase "Remove Ads" is a one-time non-consumable purchase.
- Rewarded ads are shown only when the user explicitly taps "Watch Ad" (not auto-played).
- Cloud leaderboard uses anonymous IDs by default; email sign-in is optional.
