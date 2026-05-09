/**
 * Sign-in screen — email magic link or anonymous play.
 * Accessed from the leaderboard or profile screen.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '../src/storage/storage';
import { CloudService } from '../src/services/CloudService';
import { useThemeColors } from '../src/utils/ThemeContext';
import { useLanguage } from '../src/utils/LanguageContext';
import { t } from '../src/utils/i18n';
import { Typography, Spacing, Radius } from '../src/theme';
import { HapticService } from '../src/utils/haptics';

export default function SignInScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { language } = useLanguage();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cloudUser, setCloudUser] = useState<Awaited<ReturnType<typeof StorageService.getCloudUser>>>(null);
  const available = CloudService.isAvailable();

  useEffect(() => {
    StorageService.getCloudUser().then(setCloudUser);
    StorageService.getUserProfile().then((p) => {
      if (p.username && p.username !== 'Mchezaji') setDisplayName(p.username);
    });
  }, []);

  const handleSendMagicLink = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      Alert.alert('', language === 'sw' ? 'Weka barua pepe sahihi.' : 'Enter a valid email.');
      return;
    }
    setLoading(true);
    const ok = await CloudService.requestMagicLink(trimmed);
    setLoading(false);
    if (ok) {
      setSent(true);
      HapticService.selection(true);
    } else {
      Alert.alert('', language === 'sw' ? 'Imeshindwa. Jaribu tena.' : 'Failed. Please try again.');
    }
  };

  const handlePlayAnon = async () => {
    const name = displayName.trim() || (language === 'sw' ? 'Mgeni' : 'Guest');
    setLoading(true);
    await CloudService.getOrCreateAnonUser(name);
    setLoading(false);
    HapticService.selection(true);
    router.back();
  };

  const handleSignOut = async () => {
    await CloudService.signOut();
    setCloudUser(null);
    setSent(false);
    setEmail('');
    HapticService.selection(true);
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.backBtn, { backgroundColor: colors.backgroundCardLight }]}
              >
                <Text style={[styles.backIcon, { color: colors.text }]}>‹</Text>
              </TouchableOpacity>
              <Text style={[styles.title, { color: colors.text }]}>{t('cloudSignInTitle')}</Text>
              <View style={{ width: 40 }} />
            </View>

            {!available && (
              <View style={[styles.infoCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                  ⚙️ {t('cloudNotConfigured')}
                </Text>
              </View>
            )}

            {/* Already signed in */}
            {cloudUser && !cloudUser.isAnonymous ? (
              <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                <Text style={styles.cardEmoji}>✅</Text>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{cloudUser.displayName}</Text>
                <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                  {cloudUser.email}
                </Text>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.backgroundCardLight, borderColor: colors.border }]}
                  onPress={handleSignOut}
                >
                  <Text style={[styles.btnText, { color: colors.textSecondary }]}>{t('cloudSignOut')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Sign-in card */}
                <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                  <Text style={styles.cardEmoji}>🔐</Text>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{t('cloudSignIn')}</Text>
                  <Text style={[styles.cardSub, { color: colors.textMuted }]}>{t('cloudSignInSubtitle')}</Text>

                  {sent ? (
                    <View style={styles.sentBox}>
                      <Text style={styles.sentEmoji}>📧</Text>
                      <Text style={[styles.sentText, { color: colors.text }]}>{t('cloudMagicLinkSent')}</Text>
                    </View>
                  ) : (
                    <>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.backgroundCardLight, borderColor: colors.border, color: colors.text }]}
                        value={email}
                        onChangeText={setEmail}
                        placeholder={t('cloudEmailPlaceholder')}
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={available && !loading}
                      />
                      <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: colors.primary }, (!available || loading) && styles.disabledBtn]}
                        onPress={handleSendMagicLink}
                        disabled={!available || loading}
                        activeOpacity={0.85}
                      >
                        {loading ? (
                          <ActivityIndicator color="#000" size="small" />
                        ) : (
                          <Text style={styles.primaryBtnText}>{t('cloudSendMagicLink')}</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                    {language === 'sw' ? 'au' : 'or'}
                  </Text>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                </View>

                {/* Anonymous card */}
                <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                  <Text style={styles.cardEmoji}>👤</Text>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{t('cloudSignInAnon')}</Text>
                  <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                    {language === 'sw'
                      ? 'Cheza bila akaunti. Alama zako zitahifadhiwa kwenye kifaa hiki tu.'
                      : 'Play without an account. Scores saved on this device only.'}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundCardLight, borderColor: colors.border, color: colors.text }]}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder={t('cloudDisplayName')}
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="words"
                    maxLength={20}
                  />
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { borderColor: colors.primary }]}
                    onPress={handlePlayAnon}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>{t('cloudSignInAnon')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: { padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing.xxxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 28, lineHeight: 32 },
  title: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    textAlign: 'center',
  },
  infoCard: {
    borderRadius: Radius.xl, borderWidth: 1,
    padding: Spacing.base,
  },
  infoText: { fontSize: Typography.fontSizes.sm, textAlign: 'center' },
  card: {
    borderRadius: Radius.xl, borderWidth: 1,
    padding: Spacing.lg, gap: Spacing.sm, alignItems: 'center',
  },
  cardEmoji: { fontSize: 40 },
  cardTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    textAlign: 'center',
  },
  cardSub: {
    fontSize: Typography.fontSizes.sm,
    textAlign: 'center',
    lineHeight: Typography.fontSizes.sm * 1.5,
  },
  input: {
    width: '100%', borderRadius: Radius.lg, borderWidth: 1,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    fontSize: Typography.fontSizes.md,
  },
  primaryBtn: {
    width: '100%', borderRadius: Radius.full,
    paddingVertical: Spacing.base, alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: '#000',
  },
  disabledBtn: { opacity: 0.4 },
  secondaryBtn: {
    width: '100%', borderRadius: Radius.full,
    paddingVertical: Spacing.base, alignItems: 'center', borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.semiBold,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: Typography.fontSizes.sm },
  btn: {
    borderRadius: Radius.full, paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg, borderWidth: 1, marginTop: Spacing.xs,
  },
  btnText: { fontSize: Typography.fontSizes.sm },
  sentBox: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.base },
  sentEmoji: { fontSize: 40 },
  sentText: { fontSize: Typography.fontSizes.md, textAlign: 'center', fontWeight: Typography.fontWeights.semiBold },
});
