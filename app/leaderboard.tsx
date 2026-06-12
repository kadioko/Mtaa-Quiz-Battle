import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '../src/storage/storage';
import { CloudService } from '../src/services/CloudService';
import { LeaderboardEntry, CloudLeaderboardEntry } from '../src/types';
import { getCategoryByName } from '../src/data/categories';
import { getRegionById } from '../src/data/regions';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { t } from '../src/utils/i18n';
import { useLanguage } from '../src/utils/LanguageContext';
import { formatDate } from '../src/utils/gameLogic';
import { useThemeColors } from '../src/utils/ThemeContext';

type FilterTab = 'all' | 'daily' | 'best';
type SourceTab = 'local' | 'global' | 'mikoa';

export default function LeaderboardScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const colors = useThemeColors();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [cloudEntries, setCloudEntries] = useState<CloudLeaderboardEntry[]>([]);
  const [tab, setTab] = useState<FilterTab>('all');
  const [source, setSource] = useState<SourceTab>('local');
  const [cloudLoading, setCloudLoading] = useState(false);
  const cloudAvailable = CloudService.isAvailable();

  const loadCloud = useCallback(async () => {
    setCloudLoading(true);
    const rows = await CloudService.fetchLeaderboard({ limit: 200 });
    setCloudEntries(rows);
    setCloudLoading(false);
  }, []);

  useEffect(() => {
    StorageService.getLeaderboard().then(setEntries);
    if (cloudAvailable) loadCloud();
  }, [language, cloudAvailable, loadCloud]);

  useEffect(() => {
    if ((source === 'global' || source === 'mikoa') && cloudAvailable) loadCloud();
  }, [source, cloudAvailable, loadCloud]);

  // Regional league: aggregate cloud scores by region
  const regionStandings = (() => {
    const byRegion = new Map<string, { total: number; players: Set<string>; entries: number }>();
    cloudEntries.forEach((e) => {
      if (!e.region) return;
      const bucket = byRegion.get(e.region) ?? { total: 0, players: new Set<string>(), entries: 0 };
      bucket.total += e.score;
      bucket.players.add(e.userId || e.displayName);
      bucket.entries += 1;
      byRegion.set(e.region, bucket);
    });
    return Array.from(byRegion.entries())
      .map(([regionId, stats]) => ({
        regionId,
        region: getRegionById(regionId),
        total: stats.total,
        players: stats.players.size,
      }))
      .sort((a, b) => b.total - a.total);
  })();

  const displayed = (() => {
    if (source === 'global') return [];
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

  // Apply the same All/Daily/Best filters to global cloud entries
  const displayedCloud = (() => {
    if (tab === 'daily') return cloudEntries.filter((e) => e.isDaily);
    if (tab === 'best') {
      const seen = new Set<string>();
      return cloudEntries.filter((e) => {
        const key = e.userId || e.displayName;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    return cloudEntries;
  })();

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

  const renderCloudItem = ({ item, index }: { item: CloudLeaderboardEntry; index: number }) => (
    <View style={[styles.row, { backgroundColor: colors.backgroundCard, borderColor: colors.border }, index < 3 && { borderColor: rankColor(index) }]}>
      <Text style={[styles.rank, { color: rankColor(index) }]}>{rankEmoji(index)}</Text>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: colors.text }]}>{item.displayName}</Text>
        <Text style={[styles.rowCat, { color: colors.textMuted }]} numberOfLines={1}>
          {language === 'en' ? (item.categoryName_en ?? item.categoryName) : item.categoryName}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowScore, { color: rankColor(index) }]}>{item.score}</Text>
        <Text style={[styles.rowDate, { color: colors.textMuted }]}>{formatDate(item.createdAt)}</Text>
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
          {cloudAvailable ? (
            <TouchableOpacity
              style={[styles.signInBtn, { backgroundColor: colors.backgroundCardLight }]}
              onPress={() => router.push('/signin')}
            >
              <Text style={[styles.signInBtnText, { color: colors.primary }]}>🌐</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 40 }} />}
        </View>

        {/* Source toggle: Local / Global */}
        {cloudAvailable && (
          <View style={[styles.sourceTabs, { backgroundColor: colors.backgroundCardLight }]}>
            {(['local', 'global', 'mikoa'] as SourceTab[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.sourceTab, source === s && { backgroundColor: colors.primary }]}
                onPress={() => setSource(s)}
              >
                <Text style={[styles.sourceTabText, { color: colors.textMuted }, source === s && { color: colors.black, fontWeight: Typography.fontWeights.bold }]}>
                  {s === 'local' ? `📱 ${t('cloudLocal')}` : s === 'global' ? `🌐 ${t('cloudGlobal')}` : '🗺️ Mikoa'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Filter tabs (local + global) */}
        {source !== 'mikoa' && (
          <View style={[styles.tabs, { backgroundColor: colors.backgroundCardLight }]}>
            {(['all', 'daily', 'best'] as FilterTab[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.tab, tab === f && { backgroundColor: colors.primary }]}
                onPress={() => setTab(f)}
              >
                <Text style={[styles.tabText, { color: colors.textMuted }, tab === f && { color: colors.black, fontWeight: Typography.fontWeights.bold }]}>
                  {f === 'all' ? t('allTab') : f === 'daily' ? t('dailyTab') : t('bestTab')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {source === 'mikoa' ? (
          cloudLoading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : regionStandings.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🗺️</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {language === 'sw'
                  ? 'Hakuna alama za mikoa bado. Chagua mkoa wako kwenye Profaili kisha cheza!'
                  : 'No regional scores yet. Pick your region in Profile, then play!'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={regionStandings}
              keyExtractor={(item) => item.regionId}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <View style={[styles.row, { backgroundColor: colors.backgroundCard, borderColor: colors.border }, index < 3 && { borderColor: rankColor(index) }]}>
                  <Text style={[styles.rank, { color: rankColor(index) }]}>{rankEmoji(index)}</Text>
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowName, { color: colors.text }]}>
                      {item.region?.emoji ?? '📍'} {item.region?.name ?? item.regionId}
                    </Text>
                    <Text style={[styles.rowCat, { color: colors.textMuted }]}>
                      {item.players} {language === 'sw' ? 'wachezaji' : 'players'}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={[styles.rowScore, { color: rankColor(index) }]}>{item.total}</Text>
                    <Text style={[styles.rowDate, { color: colors.textMuted }]}>
                      {language === 'sw' ? 'jumla' : 'total pts'}
                    </Text>
                  </View>
                </View>
              )}
            />
          )
        ) : source === 'global' ? (
          cloudLoading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : displayedCloud.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌐</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {language === 'sw' ? 'Hakuna alama za kimataifa bado.' : 'No global scores yet.'}
              </Text>
              <TouchableOpacity
                style={[styles.signInBtnLarge, { borderColor: colors.primary }]}
                onPress={() => router.push('/signin')}
              >
                <Text style={[styles.signInBtnLargeText, { color: colors.primary }]}>{t('cloudSignIn')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={displayedCloud}
              renderItem={renderCloudItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )
        ) : displayed.length === 0 ? (
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
  sourceTabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    padding: 3,
    gap: 3,
  },
  sourceTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  sourceTabText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semiBold,
  },
  signInBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  signInBtnText: { fontSize: 20 },
  signInBtnLarge: {
    borderWidth: 1.5, borderRadius: Radius.full,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl,
  },
  signInBtnLargeText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semiBold,
  },
});
