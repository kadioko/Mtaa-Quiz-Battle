import React, { useEffect, useState } from 'react';
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

const AVATAR_OPTIONS = [
  '🇹🇿','🦁','🐘','🦒','🦓','🐆','🦅','🌍',
  '⚽','🎵','🏆','🎮','🔥','💎','🧠','👑',
];

export default function ProfileScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [catStats, setCatStats] = useState<Record<string, number>>({});
  const [editModal, setEditModal] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [avatarModal, setAvatarModal] = useState(false);

  useEffect(() => {
    StorageService.getUserProfile().then(setProfile);
    StorageService.getCategoryStats().then(setCatStats);
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
            <TouchableOpacity style={styles.avatarCircle} onPress={() => setAvatarModal(true)} activeOpacity={0.8}>
              <Text style={styles.avatarEmoji}>{profile?.avatar ?? '��'}</Text>
              <View style={styles.avatarEditBadge}>
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
});
