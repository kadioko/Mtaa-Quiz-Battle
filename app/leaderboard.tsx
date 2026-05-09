import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '../src/storage/storage';
import { LeaderboardEntry } from '../src/types';
import { getCategoryByName } from '../src/data/categories';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { t } from '../src/utils/i18n';
import { useLanguage } from '../src/utils/LanguageContext';
import { formatDate } from '../src/utils/gameLogic';
import { useThemeColors } from '../src/utils/ThemeContext';

type FilterTab = 'all' | 'daily' | 'best';

export default function LeaderboardScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const colors = useThemeColors();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [tab, setTab] = useState<FilterTab>('all');

  const displayed = (() => {
    if (tab === 'daily') {
      return entries.filter((e) =>
        e.isDaily || e.categoryName.toLowerCase().includes('daily') || e.categoryName === 'Daily Challenge'
      );
    }
    if (tab === 'best') {
      const seen = new Set<string>();
      return entries.filter((e) => {
        if (seen.has(e.username)) return false;
        seen.add(e.username);
        return true;
      });
    }
    return entries;
  })();

  useEffect(() => {
    StorageService.getLeaderboard().then(setEntries);
  }, [language]);

  const rankColor = (i: number) => {
    if (i === 0) return colors.gold;
    if (i === 1) return colors.silver;
    if (i === 2) return colors.bronze;
    return colors.textMuted;
  };

  const rankEmoji = (i: number) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `${i + 1}`;
  };

  const getDisplayCategoryName = (entry: LeaderboardEntry): string => {
    if (entry.isDaily || entry.categoryName === 'Daily Challenge') {
      return t('dailyChallenge');
    }
    const category = getCategoryByName(entry.categoryName);
    if (!category) return entry.categoryName;
    return language === 'en' ? category.name_en : category.name;
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <View style={[styles.row, { backgroundColor: colors.backgroundCard, borderColor: colors.border }, index < 3 && { borderColor: rankColor(index) }]}>
      <Text style={[styles.rank, { color: rankColor(index) }]}>{rankEmoji(index)}</Text>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: colors.text }]}>{item.username}</Text>
        <Text style={[styles.rowCat, { color: colors.textMuted }]} numberOfLines={1}>{getDisplayCategoryName(item)}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowScore, { color: rankColor(index) }]}>{item.score}</Text>
        <Text style={[styles.rowDate, { color: colors.textMuted }]}>{formatDate(item.date)}</Text>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.backgroundCardLight }]}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🏆 {t('leaderboard')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Filter tabs */}
        <View style={[styles.tabs, { backgroundColor: colors.backgroundCardLight }]}>
          {(['all', 'daily', 'best'] as FilterTab[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.tab, tab === f && { backgroundColor: colors.primary }]}
              onPress={() => setTab(f)}
            >
              <Text style={[styles.tabText, { color: colors.textMuted }, tab === f && { color: colors.black, fontWeight: Typography.fontWeights.bold }]}>
                {f === 'all'
                  ? t('allTab')
                  : f === 'daily'
                  ? t('dailyTab')
                  : t('bestTab')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {displayed.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noLeaderboard')}</Text>
          </View>
        ) : (
          <FlatList
            data={displayed}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCardLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: { fontSize: 28, color: Colors.text, lineHeight: 32 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    backgroundColor: Colors.backgroundCardLight,
    borderRadius: Radius.lg,
    padding: 3,
    gap: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.black,
    fontWeight: Typography.fontWeights.bold,
  },
  list: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  rank: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.black,
    minWidth: 36,
    textAlign: 'center',
  },
  rowInfo: { flex: 1 },
  rowName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text,
  },
  rowCat: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  rowRight: { alignItems: 'flex-end' },
  rowScore: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.extraBold,
  },
  rowDate: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.base,
  },
  emptyEmoji: { fontSize: 64 },
  emptyText: {
    fontSize: Typography.fontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
