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
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { t } from '../src/utils/i18n';
import { useLanguage } from '../src/utils/LanguageContext';
import { formatDate } from '../src/utils/gameLogic';

export default function LeaderboardScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    StorageService.getLeaderboard().then(setEntries);
  }, [language]);

  const rankColor = (i: number) => {
    if (i === 0) return Colors.gold;
    if (i === 1) return Colors.silver;
    if (i === 2) return Colors.bronze;
    return Colors.textMuted;
  };

  const rankEmoji = (i: number) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `${i + 1}`;
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <View style={[styles.row, index < 3 && { borderColor: rankColor(index) }]}>
      <Text style={[styles.rank, { color: rankColor(index) }]}>{rankEmoji(index)}</Text>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.username}</Text>
        <Text style={styles.rowCat} numberOfLines={1}>{item.categoryName}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowScore, { color: rankColor(index) }]}>{item.score}</Text>
        <Text style={styles.rowDate}>{formatDate(item.date)}</Text>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#0F0F23', '#1A1A35']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🏆 {t('leaderboard')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyText}>{t('noLeaderboard')}</Text>
          </View>
        ) : (
          <FlatList
            data={entries}
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
