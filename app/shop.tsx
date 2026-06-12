/**
 * Shop — Coin-powered in-game shop.
 * Currently sells: Streak Freeze (50 coins each, max 5 at a time).
 * Future: Hint packs, coin bundles (IAP), etc.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { useLanguage } from '../src/utils/LanguageContext';
import { useThemeColors } from '../src/utils/ThemeContext';
import { STREAK_FREEZE_COST } from '../src/utils/gameLogic';
import { StorageService } from '../src/storage/storage';
import { IAPService, COIN_BUNDLES } from '../src/services/IAPService';
import { showRewardedAd, adsAvailable } from '../src/services/AdService';
import { Platform } from 'react-native';

const AD_COIN_REWARD = 20;

const MAX_FREEZE = 5;

export default function ShopScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const colors = useThemeColors();

  const [coins, setCoins] = useState(0);
  const [freezeCount, setFreezeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [bundleLoading, setBundleLoading] = useState<string | null>(null);

  const load = async () => {
    const profile = await StorageService.getUserProfile();
    const freeze = await StorageService.getStreakFreeze();
    setCoins(profile.totalCoins);
    setFreezeCount(freeze.count);
  };

  useEffect(() => { load(); }, []);

  const handleBuyFreeze = async () => {
    if (freezeCount >= MAX_FREEZE) {
      Alert.alert(
        language === 'sw' ? 'Imejaa' : 'Full',
        language === 'sw' ? `Una barafu ${MAX_FREEZE} tayari.` : `You already have ${MAX_FREEZE} freezes.`
      );
      return;
    }
    if (coins < STREAK_FREEZE_COST) {
      Alert.alert(
        language === 'sw' ? 'Sarafu haitoshi' : 'Not enough coins',
        language === 'sw'
          ? `Unahitaji sarafu ${STREAK_FREEZE_COST}. Una ${coins}.`
          : `You need ${STREAK_FREEZE_COST} coins. You have ${coins}.`
      );
      return;
    }
    setLoading(true);
    const result = await StorageService.purchaseStreakFreeze(STREAK_FREEZE_COST);
    setLoading(false);
    if (result.success) {
      setCoins(result.coinsLeft);
      setFreezeCount((c) => c + 1);
      Alert.alert(
        '❄️',
        language === 'sw' ? 'Barafu ya Mfululizo imenunuliwa!' : 'Streak Freeze purchased!'
      );
      // Note: the freeze_used achievement unlocks when a freeze is actually
      // consumed (see StorageService.updateProfileAfterGame), not on purchase.
    }
  };

  const handleWatchAd = async () => {
    if (adLoading) return;
    setAdLoading(true);
    const reward = await showRewardedAd('free-coins');
    if (reward) {
      const profile = await StorageService.getUserProfile();
      const newCoins = profile.totalCoins + AD_COIN_REWARD;
      await StorageService.saveUserProfile({ ...profile, totalCoins: newCoins });
      setCoins(newCoins);
      Alert.alert('🎉', language === 'sw' ? `Umepata sarafu ${AD_COIN_REWARD}!` : `You earned ${AD_COIN_REWARD} coins!`);
    } else {
      Alert.alert('', language === 'sw' ? 'Tangazo halipatikani kwa sasa. Jaribu tena baadaye.' : 'No ad available right now. Try again later.');
    }
    setAdLoading(false);
  };

  const handleBuyBundle = async (bundleId: 'small' | 'medium' | 'large') => {
    if (bundleLoading) return;
    setBundleLoading(bundleId);
    const started = await IAPService.purchaseCoinBundle(bundleId);
    setBundleLoading(null);
    if (started) {
      // Coins are credited by the purchase listener once the store confirms.
      setTimeout(load, 2500);
    } else {
      Alert.alert(
        '',
        language === 'sw'
          ? 'Ununuzi haukukamilika. Duka halipatikani kwenye kifaa hiki.'
          : 'Purchase did not complete. The store is unavailable on this device.'
      );
    }
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={[styles.backText, { color: colors.textMuted }]}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>
              {language === 'sw' ? '🛒 Duka' : '🛒 Shop'}
            </Text>
            <View style={[styles.coinsBadge, { backgroundColor: colors.backgroundCardLight }]}>
              <Text style={[styles.coinsText, { color: colors.gold }]}>🪙 {coins}</Text>
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            {language === 'sw' ? 'Vitu vya Kununua' : 'Items'}
          </Text>

          {/* Streak Freeze card */}
          <View style={[styles.itemCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <View style={styles.itemTop}>
              <Text style={styles.itemEmoji}>❄️</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>
                  {language === 'sw' ? 'Barafu ya Mfululizo' : 'Streak Freeze'}
                </Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                  {language === 'sw'
                    ? 'Inalinda mfululizo wako ukikosa siku moja. Inatumika kiotomatiki.'
                    : 'Automatically protects your streak if you miss a day.'}
                </Text>
              </View>
            </View>
            <View style={styles.itemBottom}>
              <View style={[styles.stockBadge, { backgroundColor: colors.backgroundCardLight }]}>
                <Text style={[styles.stockText, { color: freezeCount >= MAX_FREEZE ? colors.textMuted : colors.secondary }]}>
                  {language === 'sw' ? `Umehifadhi: ${freezeCount}/${MAX_FREEZE}` : `Owned: ${freezeCount}/${MAX_FREEZE}`}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.buyBtn,
                  { backgroundColor: colors.primary },
                  (loading || freezeCount >= MAX_FREEZE || coins < STREAK_FREEZE_COST) && { opacity: 0.5 },
                ]}
                onPress={handleBuyFreeze}
                disabled={loading || freezeCount >= MAX_FREEZE || coins < STREAK_FREEZE_COST}
              >
                <Text style={[styles.buyBtnText, { color: colors.black }]}>
                  {loading ? '⏳' : `🪙 ${STREAK_FREEZE_COST}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Placeholder for future items */}
          <View style={[styles.itemCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border, opacity: 0.5 }]}>
            <View style={styles.itemTop}>
              <Text style={styles.itemEmoji}>💡</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>
                  {language === 'sw' ? 'Vidokezo 5' : '5 Hints Pack'}
                </Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                  {language === 'sw' ? 'Inakuja hivi karibuni' : 'Coming soon'}
                </Text>
              </View>
            </View>
          </View>

          {/* Free coins via rewarded ad */}
          {Platform.OS !== 'web' && adsAvailable() && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                {language === 'sw' ? 'Sarafu za Bure' : 'Free Coins'}
              </Text>
              <View style={[styles.itemCard, { backgroundColor: colors.backgroundCard, borderColor: colors.secondary }]}>
                <View style={styles.itemTop}>
                  <Text style={styles.itemEmoji}>📺</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>
                      {language === 'sw' ? 'Tazama Tangazo' : 'Watch an Ad'}
                    </Text>
                    <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                      {language === 'sw'
                        ? `Tazama tangazo fupi upate sarafu ${AD_COIN_REWARD} bure.`
                        : `Watch a short ad and earn ${AD_COIN_REWARD} free coins.`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.buyBtn, { backgroundColor: colors.secondary }, adLoading && { opacity: 0.5 }]}
                    onPress={handleWatchAd}
                    disabled={adLoading}
                    accessibilityRole="button"
                    accessibilityLabel={language === 'sw' ? 'Tazama tangazo upate sarafu' : 'Watch ad for coins'}
                  >
                    <Text style={[styles.buyBtnText, { color: colors.white }]}>
                      {adLoading ? '⏳' : `+${AD_COIN_REWARD}🪙`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* Coin bundles (IAP) */}
          {Platform.OS !== 'web' && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                {language === 'sw' ? 'Vifurushi vya Sarafu' : 'Coin Bundles'}
              </Text>
              <View style={styles.bundleRow}>
                {COIN_BUNDLES.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.bundleCard, { backgroundColor: colors.backgroundCard, borderColor: colors.gold }, bundleLoading === b.id && { opacity: 0.5 }]}
                    onPress={() => handleBuyBundle(b.id)}
                    disabled={bundleLoading !== null}
                    accessibilityRole="button"
                    accessibilityLabel={`${b.coins} ${language === 'sw' ? 'sarafu' : 'coins'}`}
                  >
                    <Text style={styles.bundleEmoji}>{b.emoji}</Text>
                    <Text style={[styles.bundleCoins, { color: colors.gold }]}>{b.coins}</Text>
                    <Text style={[styles.bundleLabel, { color: colors.textMuted }]}>
                      {bundleLoading === b.id ? '⏳' : (language === 'sw' ? 'Nunua' : 'Buy')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.helpText, { color: colors.textMuted, marginTop: 0, marginBottom: Spacing.base }]}>
                {language === 'sw'
                  ? 'Bei huonyeshwa na duka lako (Google Play / App Store).'
                  : 'Prices are shown by your store (Google Play / App Store).'}
              </Text>
            </>
          )}

          <Text style={[styles.helpText, { color: colors.textMuted }]}>
            {language === 'sw'
              ? '💡 Pata sarafu kwa kucheza mchezo, kumaliza raundi kamili, au kutumia changamoto ya kila siku.'
              : '💡 Earn coins by playing games, completing perfect rounds, or finishing the daily challenge.'}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.xxxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold },
  title: { flex: 1, fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.extraBold },
  coinsBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.base, paddingVertical: Spacing.xs },
  coinsText: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold },
  sectionLabel: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semiBold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  itemCard: { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.base, marginBottom: Spacing.base, gap: Spacing.base },
  itemTop: { flexDirection: 'row', gap: Spacing.base, alignItems: 'flex-start' },
  itemEmoji: { fontSize: 36 },
  itemTitle: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, marginBottom: 2 },
  itemDesc: { fontSize: Typography.fontSizes.sm, lineHeight: Typography.fontSizes.sm * 1.5 },
  itemBottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stockBadge: { flex: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  stockText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium },
  buyBtn: { borderRadius: Radius.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  buyBtnText: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold },
  helpText: { fontSize: Typography.fontSizes.sm, textAlign: 'center', lineHeight: Typography.fontSizes.sm * 1.6, marginTop: Spacing.base },
  bundleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  bundleCard: { flex: 1, borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.base, alignItems: 'center', gap: 4 },
  bundleEmoji: { fontSize: 28 },
  bundleCoins: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.extraBold },
  bundleLabel: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semiBold },
});
