/**
 * IAPService — In-App Purchases (Remove Ads) via expo-in-app-purchases.
 *
 * ⚠️  SETUP REQUIRED before using in production:
 *
 *   Google Play:
 *     1. Upload a signed APK/AAB to Play Console (Internal Testing track).
 *     2. Create an in-app product with the Product ID below.
 *     3. Activate the product in Play Console.
 *
 *   Apple App Store:
 *     1. Create a non-consumable IAP in App Store Connect.
 *     2. Use the same Product ID (or update IOS_PRODUCT_ID if different).
 *
 *   Then replace PRODUCT_IDs below with your real product identifiers.
 *
 * Storage:
 *   Purchase status is persisted to AsyncStorage so the user doesn't
 *   need to be connected to verify on every launch (receipt validated on purchase).
 */
import * as InAppPurchases from 'expo-in-app-purchases';
import type { IAPItemDetails } from 'expo-in-app-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ── Product IDs ───────────────────────────────────────────────────────────────
// Replace with real product IDs registered in your store consoles.
const ANDROID_PRODUCT_ID = 'mtaa_remove_ads';
const IOS_PRODUCT_ID     = 'com.mtaaquiz.battle.removeads';

const PRODUCT_ID = Platform.OS === 'ios' ? IOS_PRODUCT_ID : ANDROID_PRODUCT_ID;
const STORAGE_KEY = '@mtaa_remove_ads_purchased';

// ── Coin bundles (consumable IAPs) ────────────────────────────────────────────
// Register these product IDs in Play Console / App Store Connect.
export interface CoinBundle {
  id: 'small' | 'medium' | 'large';
  productId: string;
  coins: number;
  emoji: string;
}

export const COIN_BUNDLES: CoinBundle[] = [
  { id: 'small',  productId: Platform.OS === 'ios' ? 'com.mtaaquiz.battle.coins200'  : 'mtaa_coins_200',  coins: 200,  emoji: '🪙' },
  { id: 'medium', productId: Platform.OS === 'ios' ? 'com.mtaaquiz.battle.coins600'  : 'mtaa_coins_600',  coins: 600,  emoji: '💰' },
  { id: 'large',  productId: Platform.OS === 'ios' ? 'com.mtaaquiz.battle.coins1500' : 'mtaa_coins_1500', coins: 1500, emoji: '🏦' },
];

const coinBundleByProductId = (productId: string): CoinBundle | undefined =>
  COIN_BUNDLES.find((b) => b.productId === productId);

/** Credit purchased coins to the local profile. */
async function creditCoins(amount: number): Promise<void> {
  // Lazy import avoids a circular dependency at module load
  const { StorageService } = await import('../storage/storage');
  const profile = await StorageService.getUserProfile();
  await StorageService.saveUserProfile({ ...profile, totalCoins: profile.totalCoins + amount });
}

export const IAPService = {
  /**
   * Connect to the store and register the purchase listener.
   * Call once on app startup (native only).
   */
  async connect(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await InAppPurchases.connectAsync();
      InAppPurchases.setPurchaseListener(({ responseCode, results }) => {
        if (responseCode !== InAppPurchases.IAPResponseCode.OK || !results) return;
        for (const purchase of results) {
          if (purchase.acknowledged) continue;
          if (purchase.productId === PRODUCT_ID) {
            // Non-consumable: Remove Ads
            InAppPurchases.finishTransactionAsync(purchase, true).catch(() => {});
            IAPService._setPurchased(true).catch(() => {});
          } else {
            const bundle = coinBundleByProductId(purchase.productId);
            if (bundle) {
              // Consumable: finish with consume=true so it can be bought again
              InAppPurchases.finishTransactionAsync(purchase, true).catch(() => {});
              creditCoins(bundle.coins).catch(() => {});
            }
          }
        }
      });
    } catch {
      // Store not available in emulator / dev without signed build — safe to ignore.
    }
  },

  /**
   * Disconnect from the store. Call in cleanup (e.g. app unmount).
   */
  async disconnect(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await InAppPurchases.disconnectAsync();
    } catch {}
  },

  /**
   * Fetch available product details from the store.
   */
  async getProducts(): Promise<IAPItemDetails[]> {
    if (Platform.OS === 'web') return [];
    try {
      const { responseCode, results } = await InAppPurchases.getProductsAsync([PRODUCT_ID]);
      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) return results;
    } catch {}
    return [];
  },

  /**
   * Initiate the purchase flow for Remove Ads.
   * Returns true if the purchase completed successfully.
   */
  async purchaseRemoveAds(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      await InAppPurchases.purchaseItemAsync(PRODUCT_ID);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Initiate purchase of a consumable coin bundle.
   * Coins are credited by the purchase listener when the store confirms.
   */
  async purchaseCoinBundle(bundleId: CoinBundle['id']): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const bundle = COIN_BUNDLES.find((b) => b.id === bundleId);
    if (!bundle) return false;
    try {
      await InAppPurchases.purchaseItemAsync(bundle.productId);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Restore previous purchases (required by App Store guidelines).
   * Returns true if Remove Ads was found in purchase history.
   */
  async restorePurchases(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
      if (responseCode !== InAppPurchases.IAPResponseCode.OK || !results) return false;
      const found = results.some((p) => p.productId === PRODUCT_ID);
      if (found) await IAPService._setPurchased(true);
      return found;
    } catch {
      return false;
    }
  },

  /**
   * Check local storage for the Remove Ads purchase flag.
   */
  async isAdFree(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },

  async _setPurchased(value: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
    } catch {}
  },
};
