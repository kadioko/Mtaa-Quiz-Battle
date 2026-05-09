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
import { STREAK_FREEZE_COST, evaluateAchievements } from '../src/utils/gameLogic';
import { StorageService } from '../src/storage/storage';

const MAX_FREEZE = 5;

export default function ShopScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const colors = useThemeColors();

  const [coins, setCoins] = useState(0);
  const [freezeCount, setFreezeCount] = useState(0);
  const [loading, setLoading] = useState(false);

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
      // Check achievements
      const profile = await StorageService.getUserProfile();
      const existing = await StorageService.getUnlockedAchievements();
      const updated = evaluateAchievements(profile, [], existing, { freezeEverUsed: true });
      if (updated.length !== existing.length) await StorageService.saveUnlockedAchievements(updated);
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
});
