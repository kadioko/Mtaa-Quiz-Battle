import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '../src/storage/storage';
import { UserProfile } from '../src/types';
import { categories } from '../src/data/categories';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { t } from '../src/utils/i18n';
import { useLanguage } from '../src/utils/LanguageContext';
import StatCard from '../src/components/StatCard';

export default function ProfileScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [catStats, setCatStats] = useState<Record<string, number>>({});

  useEffect(() => {
    StorageService.getUserProfile().then(setProfile);
    StorageService.getCategoryStats().then(setCatStats);
  }, [language]);

  const getFavoriteCategory = (): string => {
    if (!catStats || Object.keys(catStats).length === 0) return t('noFavorite');
    let maxId = '';
    let maxCount = 0;
    Object.keys(catStats).forEach((id) => {
      if (catStats[id] > maxCount) {
        maxCount = catStats[id];
        maxId = id;
      }
    });
    const cat = categories.find((c) => c.id === maxId);
    if (!cat) return t('noFavorite');
    return language === 'en' ? cat.name_en : cat.name;
  };

  const accuracy =
    profile && profile.totalQuestions > 0
      ? Math.round((profile.totalCorrectAnswers / profile.totalQuestions) * 100)
      : 0;

  return (
    <LinearGradient colors={['#0F0F23', '#1A1A35']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>👤 {t('profile')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>🇹🇿</Text>
            </View>
            <Text style={styles.username}>{profile?.username ?? 'Mchezaji'}</Text>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {profile?.dailyStreak ?? 0} {t('days')}</Text>
            </View>
          </View>

          {/* Top stats */}
          <View style={styles.statsRow}>
            <StatCard
              label={t('totalGamesPlayed')}
              value={profile?.totalGamesPlayed ?? 0}
              emoji="🎮"
              color={Colors.primary}
            />
            <StatCard
              label={t('bestScore')}
              value={profile?.bestScore ?? 0}
              emoji="⭐"
              color={Colors.gold}
            />
            <StatCard
              label={t('totalCoins')}
              value={profile?.totalCoins ?? 0}
              emoji="🪙"
              color={Colors.secondary}
            />
          </View>

          {/* Detail cards */}
          <View style={styles.detailCard}>
            <DetailRow
              label={t('accuracy')}
              value={`${accuracy}%`}
              emoji="🎯"
            />
            <View style={styles.divider} />
            <DetailRow
              label={t('currentStreak')}
              value={`${profile?.currentStreak ?? 0} ${t('days')}`}
              emoji="🔥"
            />
            <View style={styles.divider} />
            <DetailRow
              label={t('longestStreak')}
              value={`${profile?.longestStreak ?? 0} ${t('days')}`}
              emoji="🏅"
            />
            <View style={styles.divider} />
            <DetailRow
              label={t('favoriteCategory')}
              value={getFavoriteCategory()}
              emoji="❤️"
            />
            <View style={styles.divider} />
            <DetailRow
              label={t('dailyStreakLabel')}
              value={`${profile?.dailyStreak ?? 0} ${t('days')}`}
              emoji="⚡"
            />
          </View>

          {/* Correct vs total */}
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>
              {t('correctAnswers')}: {profile?.totalCorrectAnswers ?? 0} / {profile?.totalQuestions ?? 0}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${accuracy}%`, backgroundColor: accuracy >= 70 ? Colors.secondary : Colors.primary },
                ]}
              />
            </View>
            <Text style={styles.progressPct}>{accuracy}%</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function DetailRow({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailEmoji}>{emoji}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
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
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.backgroundCardLight,
    borderWidth: 3,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarEmoji: { fontSize: 44 },
  username: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  streakBadge: {
    backgroundColor: Colors.streak + '22',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.streak,
  },
  streakText: {
    color: Colors.streak,
    fontWeight: Typography.fontWeights.bold,
    fontSize: Typography.fontSizes.sm,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  detailCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  detailEmoji: { fontSize: 20, width: 28 },
  detailLabel: {
    flex: 1,
    fontSize: Typography.fontSizes.md,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.text,
  },
  divider: { height: 1, backgroundColor: Colors.border },
  progressCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
  },
  progressTitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  progressTrack: {
    height: 10,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  progressPct: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text,
    textAlign: 'right',
  },
});
