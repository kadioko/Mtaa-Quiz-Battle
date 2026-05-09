import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '../src/storage/storage';
import { UserProfile, AchievementId, Achievement, CategoryMastery, QuizResult } from '../src/types';
import { categories } from '../src/data/categories';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { t } from '../src/utils/i18n';
import { useLanguage } from '../src/utils/LanguageContext';
import StatCard from '../src/components/StatCard';
import { useThemeColors } from '../src/utils/ThemeContext';
import {
  getPlayerRank,
  getNextRank,
  ACHIEVEMENT_CATALOG,
  getCategoryMastery,
  formatDate,
} from '../src/utils/gameLogic';

const AVATAR_OPTIONS = [
  '🇹🇿','🦁','🐘','🦒','🦓','🐆','🦅','🌍',
  '⚽','🎵','🏆','🎮','🔥','💎','🧠','👑',
];

export default function ProfileScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const colors = useThemeColors();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [catStats, setCatStats] = useState<Record<string, number>>({});
  const [unlockedIds, setUnlockedIds] = useState<AchievementId[]>([]);
  const [mastery, setMastery] = useState<CategoryMastery[]>([]);
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [avatarModal, setAvatarModal] = useState(false);
  const accuracyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const load = async () => {
      const [p, cs, ids, h] = await Promise.all([
        StorageService.getUserProfile(),
        StorageService.getCategoryStats(),
        StorageService.getUnlockedAchievements(),
        StorageService.getQuizHistory(),
      ]);
      setProfile(p);
      setCatStats(cs);
      setUnlockedIds(ids);
      setHistory(h);
      setMastery(getCategoryMastery(h));
    };
    load();
  }, [language]);

  const openEdit = () => {
    setDraftName(profile?.username ?? 'Mchezaji');
    setEditModal(true);
  };

  const saveUsername = async () => {
    const name = draftName.trim() || 'Mchezaji';
    if (!profile) return;
    const updated = { ...profile, username: name };
    setProfile(updated);
    await StorageService.saveUserProfile(updated);
    setEditModal(false);
  };

  const saveAvatar = async (emoji: string) => {
    if (!profile) return;
    const updated = { ...profile, avatar: emoji };
    setProfile(updated);
    await StorageService.saveUserProfile(updated);
    setAvatarModal(false);
  };

  const getFavoriteCategory = (): string => {
    const knownCategoryIds = new Set(categories.map((category) => category.id));
    const favoriteEntry = Object.entries(catStats)
      .filter(([id]) => knownCategoryIds.has(id))
      .sort((a, b) => b[1] - a[1])[0];
    const cat = categories.find((c) => c.id === (favoriteEntry?.[0] ?? profile?.favoriteCategory));
    if (!cat) return t('noFavorite');
    return language === 'en' ? cat.name_en : cat.name;
  };

  const accuracy =
    profile && profile.totalQuestions > 0
      ? Math.round((profile.totalCorrectAnswers / profile.totalQuestions) * 100)
      : 0;

  useEffect(() => {
    Animated.timing(accuracyAnim, {
      toValue: accuracy,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [accuracy]);

  const rank = getPlayerRank(profile?.totalCoins ?? 0);
  const nextRank = getNextRank(profile?.totalCoins ?? 0);

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.backgroundCardLight }]}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>👤 {t('profile')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Avatar & username ── */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={[styles.avatarCircle, { borderColor: rank.color }]} onPress={() => setAvatarModal(true)} activeOpacity={0.8}>
              <Text style={styles.avatarEmoji}>{profile?.avatar ?? '🇹🇿'}</Text>
              <View style={[styles.avatarEditBadge, { backgroundColor: rank.color }]}>
                <Text style={styles.avatarEditIcon}>✏️</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={openEdit} style={styles.usernameRow}>
              <Text style={styles.username}>{profile?.username ?? 'Mchezaji'}</Text>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {profile?.dailyStreak ?? 0} {t('days')}</Text>
            </View>
          </View>

          {/* ── Rank Banner ── */}
          <View style={[styles.rankBanner, { backgroundColor: rank.color + '22', borderColor: rank.color }]}>
            <View style={styles.rankLeft}>
              <Text style={styles.rankEmoji}>{rank.emoji}</Text>
              <View>
                <Text style={[styles.rankTitle, { color: rank.color }]}>
                  {language === 'en' ? rank.title_en : rank.title}
                </Text>
                <Text style={[styles.rankSub, { color: colors.textSecondary }]}>
                  {t('levelLabel')} {rank.level} · {profile?.totalCoins ?? 0} 🪙
                </Text>
              </View>
            </View>
            <View style={styles.rankRight}>
              {nextRank ? (
                <>
                  <Text style={[styles.rankNextLabel, { color: colors.textSecondary }]}>{t('nextRank')}</Text>
                  <Text style={[styles.rankNextTitle, { color: colors.text }]}>{nextRank.emoji} {language === 'en' ? nextRank.title_en : nextRank.title}</Text>
                  <View style={[styles.rankProgressTrack, { backgroundColor: colors.border }]}>
                    <View style={[styles.rankProgressFill, {
                      backgroundColor: rank.color,
                      width: `${Math.min(100, Math.round(((profile?.totalCoins ?? 0) - rank.minCoins) / (nextRank.minCoins - rank.minCoins) * 100))}%`,
                    }]} />
                  </View>
                  <Text style={[styles.rankNextCoins, { color: colors.textSecondary }]}>
                    {t('coinsNeeded', { n: nextRank.minCoins - (profile?.totalCoins ?? 0) })}
                  </Text>
                </>
              ) : (
                <Text style={[styles.rankNextLabel, { color: rank.color }]}>{t('maxRank')}</Text>
              )}
            </View>
          </View>

          {/* ── Top stats ── */}
          <View style={styles.statsRow}>
            <StatCard label={t('totalGamesPlayed')} value={profile?.totalGamesPlayed ?? 0} emoji="🎮" color={colors.primary} />
            <StatCard label={t('bestScore')}         value={profile?.bestScore ?? 0}         emoji="⭐" color={colors.gold} />
            <StatCard label={t('totalCoins')}        value={profile?.totalCoins ?? 0}        emoji="🪙" color={colors.secondary} />
          </View>

          {/* ── Detail rows ── */}
          <View style={[styles.detailCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <DetailRow label={t('accuracy')}         value={`${accuracy}%`}                                     emoji="🎯" />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <DetailRow label={t('currentStreak')}    value={`${profile?.currentStreak ?? 0} ${t('days')}`}      emoji="🔥" />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <DetailRow label={t('longestStreak')}    value={`${profile?.longestStreak ?? 0} ${t('days')}`}      emoji="🏅" />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <DetailRow label={t('favoriteCategory')} value={getFavoriteCategory()}                               emoji="❤️" />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <DetailRow label={t('dailyStreakLabel')}  value={`${profile?.dailyStreak ?? 0} ${t('days')}`}        emoji="⚡" />
          </View>

          {/* ── Overall accuracy bar ── */}
          <View style={[styles.progressCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Text style={[styles.progressTitle, { color: colors.textSecondary }]}>
              {t('correctAnswers')}: {profile?.totalCorrectAnswers ?? 0} / {profile?.totalQuestions ?? 0}
            </Text>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, {
                width: accuracyAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                backgroundColor: accuracy >= 70 ? colors.secondary : colors.primary,
              }]} />
            </View>
            <Text style={[styles.progressPct, { color: colors.text }]}>{accuracy}%</Text>
          </View>

          {/* ── Category Mastery ── */}
          <View style={[styles.sectionCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🗺️ {t('categoryMastery')}</Text>
            {mastery.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noRecentGames')}</Text>
            ) : (
              mastery.map((m) => (
                <View key={m.categoryId} style={styles.masteryRow}>
                  <Text style={styles.masteryEmoji}>{m.emoji}</Text>
                  <View style={styles.masteryInfo}>
                    <View style={styles.masteryHeader}>
                      <Text style={[styles.masteryName, { color: colors.text }]} numberOfLines={1}>
                        {language === 'en' ? m.categoryName_en : m.categoryName}
                      </Text>
                      <Text style={[styles.masteryPct, { color: m.color }]}>{m.accuracy}%</Text>
                    </View>
                    <View style={[styles.masteryTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.masteryFill, { width: `${m.accuracy}%`, backgroundColor: m.color }]} />
                    </View>
                    <Text style={[styles.masteryMeta, { color: colors.textSecondary }]}>
                      {t('masteryGames', { n: m.gamesPlayed })} · {m.correctAnswers}/{m.totalQuestions}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* ── Achievements ── */}
          <View style={[styles.sectionCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🏅 {t('achievements')} ({unlockedIds.length}/{ACHIEVEMENT_CATALOG.length})</Text>
              <TouchableOpacity onPress={() => setShowAllAchievements((v) => !v)}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  {showAllAchievements ? (language === 'sw' ? 'Panga' : 'Collapse') : t('viewAll')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.achievementsGrid}>
              {(showAllAchievements ? ACHIEVEMENT_CATALOG : ACHIEVEMENT_CATALOG.filter((a) => unlockedIds.includes(a.id)).slice(0, 8)).map((ach) => {
                const unlocked = unlockedIds.includes(ach.id);
                return (
                  <View key={ach.id} style={[styles.achBadge, {
                    backgroundColor: unlocked ? colors.backgroundCardLight : colors.border + '44',
                    borderColor: unlocked ? colors.primary + '88' : colors.border,
                    opacity: unlocked ? 1 : 0.45,
                  }]}>
                    <Text style={styles.achEmoji}>{ach.emoji}</Text>
                    <Text style={[styles.achTitle, { color: unlocked ? colors.text : colors.textSecondary }]} numberOfLines={2}>
                      {language === 'en' ? ach.title_en : ach.title}
                    </Text>
                  </View>
                );
              })}
            </View>
            {!showAllAchievements && unlockedIds.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noAchievements')}</Text>
            )}
          </View>

          {/* ── Recent Games History ── */}
          <View style={[styles.sectionCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🕹️ {t('recentGames')}</Text>
            {history.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noRecentGames')}</Text>
            ) : (
              history.slice(0, 10).map((r) => (
                <View key={r.id} style={[styles.historyCard, { backgroundColor: colors.backgroundCardLight, borderColor: colors.border }]}>
                  <View style={styles.historyLeft}>
                    <Text style={[styles.historyCategory, { color: colors.text }]} numberOfLines={1}>
                      {r.isDaily ? '📅 Daily' : r.categoryName}
                    </Text>
                    <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{formatDate(r.date)}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={[styles.historyScore, { color: colors.gold }]}>⭐ {r.score}</Text>
                    <Text style={[styles.historyAccuracy, { color: r.accuracy >= 70 ? colors.secondary : colors.textSecondary }]}>
                      {r.correctAnswers}/{r.totalQuestions} · {r.accuracy}%
                    </Text>
                    <Text style={[styles.historyCoins, { color: colors.secondary }]}>+{r.coinsEarned} 🪙</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Avatar picker modal */}
      <Modal visible={avatarModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {language === 'sw' ? 'Chagua Picha' : 'Choose Avatar'}
            </Text>
            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.avatarOption,
                    profile?.avatar === emoji && styles.avatarOptionActive,
                  ]}
                  onPress={() => saveAvatar(emoji)}
                >
                  <Text style={styles.avatarOptionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.avatarCancelBtn} onPress={() => setAvatarModal(false)}>
              <Text style={styles.avatarCancelText}>{language === 'sw' ? 'Ghairi' : 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Username edit modal */}
      <Modal visible={editModal} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {language === 'sw' ? 'Badilisha Jina' : 'Edit Username'}
            </Text>
            <TextInput
              style={styles.nameInput}
              value={draftName}
              onChangeText={setDraftName}
              maxLength={20}
              autoFocus
              selectTextOnFocus
              placeholder="Mchezaji"
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: Colors.border }]}
                onPress={() => setEditModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: Colors.textMuted }]}>
                  {language === 'sw' ? 'Ghairi' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                onPress={saveUsername}
              >
                <Text style={[styles.modalBtnText, { color: Colors.black }]}>
                  {language === 'sw' ? 'Hifadhi' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditIcon: { fontSize: 10 },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  avatarOption: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.backgroundCardLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '22',
  },
  avatarOptionEmoji: { fontSize: 26 },
  avatarCancelBtn: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  avatarCancelText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizes.md,
  },
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
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  editIcon: { fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: Spacing.base,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: Colors.backgroundCardLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: Typography.fontSizes.base,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semiBold,
  },
  rankBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    gap: Spacing.base,
  },
  rankLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rankEmoji: { fontSize: 36 },
  rankTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
  },
  rankSub: { fontSize: Typography.fontSizes.xs },
  rankRight: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  rankNextLabel: { fontSize: Typography.fontSizes.xs },
  rankNextTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semiBold,
  },
  rankProgressTrack: {
    width: '100%',
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: 2,
  },
  rankProgressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  rankNextCoins: { fontSize: Typography.fontSizes.xs, marginTop: 2 },
  sectionCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  viewAllText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semiBold,
  },
  emptyText: {
    fontSize: Typography.fontSizes.sm,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  masteryEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  masteryInfo: { flex: 1 },
  masteryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  masteryName: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semiBold,
  },
  masteryPct: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    marginLeft: Spacing.xs,
  },
  masteryTrack: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: 2,
  },
  masteryFill: { height: '100%', borderRadius: Radius.full },
  masteryMeta: { fontSize: Typography.fontSizes.xs },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  achBadge: {
    width: '22%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  achEmoji: { fontSize: 24 },
  achTitle: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  historyLeft: { flex: 1 },
  historyCategory: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semiBold,
    marginBottom: 2,
  },
  historyDate: { fontSize: Typography.fontSizes.xs },
  historyRight: { alignItems: 'flex-end', gap: 2 },
  historyScore: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
  },
  historyAccuracy: { fontSize: Typography.fontSizes.xs },
  historyCoins: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semiBold,
  },
});
