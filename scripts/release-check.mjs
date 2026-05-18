#!/usr/bin/env node
/**
 * release-check.mjs — Pre-release gate for Mtaa Quiz Battle v1.0
 *
 * Checks that all placeholder IDs have been replaced before a production build.
 * Run: node scripts/release-check.mjs
 *
 * Also checks:
 *   - app.json version/versionCode are not defaults
 *   - asset files are not 69-byte placeholders
 *   - eas.json submit config has real values
 *   - No hardcoded console.log in production source
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

let errors = 0;
let warnings = 0;

function fail(msg) { console.error(`  ✗ ${msg}`); errors++; }
function warn(msg)  { console.warn(`  ⚠ ${msg}`); warnings++; }
function ok(msg)    { console.log(`  ✓ ${msg}`); }
function section(title) { console.log(`\n── ${title} ──`); }

// ── 1. AdMob placeholder IDs ─────────────────────────────────────────────────
section('AdMob IDs');
const adService = readFileSync(resolve(root, 'src/services/AdService.ts'), 'utf8');
const hasAdPlaceholder = adService.includes('ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX');
if (hasAdPlaceholder) {
  fail('AdService.ts still contains placeholder AdMob Ad Unit IDs. Replace with real IDs from AdMob console.');
} else {
  ok('AdService.ts Ad Unit IDs look real.');
}

// ── 2. AdMob App IDs in app.json ─────────────────────────────────────────────
section('app.json AdMob App IDs');
const appJson = JSON.parse(readFileSync(resolve(root, 'app.json'), 'utf8'));
const plugins = appJson.expo.plugins ?? [];
const adsPlugin = plugins.find(p => Array.isArray(p) && p[0] === 'react-native-google-mobile-ads');
if (adsPlugin) {
  const { androidAppId, iosAppId } = adsPlugin[1] ?? {};
  if (androidAppId?.includes('XXXXXXXXXXXXXXXX')) fail('app.json androidAppId is still a placeholder.');
  else ok(`androidAppId: ${androidAppId}`);
  if (iosAppId?.includes('XXXXXXXXXXXXXXXX')) fail('app.json iosAppId is still a placeholder.');
  else ok(`iosAppId: ${iosAppId}`);
}

// ── 3. IAP Product IDs ───────────────────────────────────────────────────────
section('IAP Product IDs');
const iapService = readFileSync(resolve(root, 'src/services/IAPService.ts'), 'utf8');
const hasAndroidIAP = iapService.includes("'mtaa_remove_ads'");
const hasIosIAP     = iapService.includes("'com.mtaaquiz.battle.removeads'");
if (hasAndroidIAP) ok("Android IAP product ID: 'mtaa_remove_ads'");
else fail('Could not find ANDROID_PRODUCT_ID in IAPService.ts.');
if (hasIosIAP) ok("iOS IAP product ID: 'com.mtaaquiz.battle.removeads'");
else fail('Could not find IOS_PRODUCT_ID in IAPService.ts.');
// These IDs look intentional — warn only if they need to match Play Console exactly
warn("Verify 'mtaa_remove_ads' is created and activated in Play Console Internal Testing track.");
warn("Verify 'com.mtaaquiz.battle.removeads' is created in App Store Connect.");

// ── 4. eas.json submit config ─────────────────────────────────────────────────
section('eas.json Submit Config');
const easJson = JSON.parse(readFileSync(resolve(root, 'eas.json'), 'utf8'));
const ios = easJson.submit?.production?.ios ?? {};
if (ios.appleId?.includes('YOUR_APPLE_ID')) fail('eas.json appleId is still a placeholder.');
else ok(`appleId: ${ios.appleId}`);
if (ios.ascAppId?.includes('YOUR_APP_STORE')) fail('eas.json ascAppId is still a placeholder.');
else ok(`ascAppId: ${ios.ascAppId}`);
if (ios.appleTeamId?.includes('YOUR_APPLE_TEAM')) fail('eas.json appleTeamId is still a placeholder.');
else ok(`appleTeamId: ${ios.appleTeamId}`);

const android = easJson.submit?.production?.android ?? {};
const keyPath = resolve(root, android.serviceAccountKeyPath ?? './google-play-key.json');
try {
  statSync(keyPath);
  ok(`google-play-key.json found at ${android.serviceAccountKeyPath}`);
} catch {
  fail(`google-play-key.json not found at ${android.serviceAccountKeyPath ?? './google-play-key.json'}. Download from Google Play Console → Setup → API access.`);
}

// ── 5. Asset sizes (placeholder = 69 bytes) ───────────────────────────────────
section('Assets');
const ASSETS = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'];
for (const asset of ASSETS) {
  const path = resolve(root, 'assets', asset);
  try {
    const { size } = statSync(path);
    if (size <= 200) {
      fail(`assets/${asset} is ${size} bytes — looks like a placeholder. Replace with production artwork.`);
    } else {
      ok(`assets/${asset} — ${(size / 1024).toFixed(1)} KB`);
    }
  } catch {
    fail(`assets/${asset} not found.`);
  }
}

// ── 6. app.json version & versionCode ────────────────────────────────────────
section('Versioning');
const { version } = appJson.expo;
const { versionCode } = appJson.expo.android ?? {};
ok(`app.json version: ${version}`);
if (versionCode === 0) warn('versionCode is 0. Should be ≥ 1.');
else ok(`versionCode: ${versionCode}`);

// ── 7. console.log in source ──────────────────────────────────────────────────
section('console.log check');

const findSourceFiles = (dir) => {
  const entries = readdirSync(resolve(root, dir), { withFileTypes: true });
  return entries.flatMap((entry) => {
    const relativePath = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return findSourceFiles(relativePath);
    return /\.(ts|tsx)$/.test(entry.name) ? [relativePath] : [];
  });
};

const consoleLogFiles = [...findSourceFiles('src'), ...findSourceFiles('app')]
  .filter((file) => readFileSync(resolve(root, file), 'utf8').includes('console.log'));

if (consoleLogFiles.length > 0) {
  warn(`console.log found in:\n${consoleLogFiles.map(f => '    ' + f).join('\n')}`);
} else {
  ok('No console.log found in src/ or app/.');
}

// ── 8. EAS project ID ────────────────────────────────────────────────────────
section('EAS Project ID');
const projectId = appJson.expo?.extra?.eas?.projectId ?? appJson.expo?.updates?.projectId;
if (!projectId) {
  warn('No EAS projectId found in app.json. Run `eas init` to link this project.');
} else {
  ok(`EAS projectId: ${projectId}`);
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
if (errors === 0 && warnings === 0) {
  console.log('✅ All release checks passed. Ready to build.');
} else if (errors === 0) {
  console.log(`⚠  ${warnings} warning(s). Review above, then build when ready.`);
} else {
  console.log(`❌ ${errors} error(s) must be fixed before production build.`);
  process.exit(1);
}
