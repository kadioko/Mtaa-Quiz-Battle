/**
 * AdService — Google Mobile Ads (rewarded ads) scaffolding.
 *
 * ⚠️  SETUP REQUIRED before using in production:
 *   1. Create a Google AdMob account at https://admob.google.com
 *   2. Create an app and two rewarded ad units (one for each reward type).
 *   3. Replace the placeholder IDs below with your real Ad Unit IDs.
 *   4. Replace the AdMob App IDs in app.json plugins.react-native-google-mobile-ads.
 *
 * During development, the TEST IDs below will show real test ads.
 *
 * Reward types:
 *   'extra-life'   → grants an extra attempt after a quiz (stored in profile)
 *   'double-coins' → doubles coins earned in the last result (applied on result screen)
 */
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

// ── Ad Unit IDs ───────────────────────────────────────────────────────────────
// Replace with real IDs from AdMob console after creating ad units.
const AD_UNITS = {
  android: {
    'extra-life':   'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    'double-coins': 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    'free-coins':   'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  },
  ios: {
    'extra-life':   'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    'double-coins': 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    'free-coins':   'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  },
};

// Use test IDs in non-production environments
const IS_TEST = __DEV__;

function getAdUnitId(type: AdRewardType): string {
  if (IS_TEST) return TestIds.REWARDED;
  return Platform.OS === 'ios'
    ? AD_UNITS.ios[type]
    : AD_UNITS.android[type];
}

export type AdRewardType = 'extra-life' | 'double-coins' | 'free-coins';

export interface AdReward {
  type: 'currency' | string;
  amount: number;
}

/**
 * Load and show a rewarded ad.
 * @param type The reward type to trigger.
 * @returns The reward data on success, or null if ad wasn't available / user closed early.
 */
export function showRewardedAd(type: AdRewardType): Promise<AdReward | null> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      // Ads not supported on web — resolve null gracefully.
      resolve(null);
      return;
    }

    const adUnitId = getAdUnitId(type);
    const rewarded = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
      keywords: ['game', 'trivia', 'education'],
    });

    let earned = false;

    const unsubscribeReward = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        earned = true;
        resolve(reward as AdReward);
      }
    );

    const unsubscribeClose = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        unsubscribeReward();
        unsubscribeClose();
        if (!earned) resolve(null);
      }
    );

    const unsubscribeError = rewarded.addAdEventListener(
      AdEventType.ERROR,
      () => {
        unsubscribeReward();
        unsubscribeClose();
        unsubscribeError();
        resolve(null);
      }
    );

    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        unsubscribeLoaded();
        rewarded.show();
      }
    );

    rewarded.load();
  });
}

/**
 * Check if rewarded ads are available on the current platform.
 */
export function adsAvailable(): boolean {
  return Platform.OS !== 'web';
}
