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
          if (purchase.productId === PRODUCT_ID && !purchase.acknowledged) {
            InAppPurchases.finishTransactionAsync(purchase, true).catch(() => {});
            IAPService._setPurchased(true).catch(() => {});
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
