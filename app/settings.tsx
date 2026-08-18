import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '../src/storage/storage';
import packageJson from '../package.json';
import { GameSettings } from '../src/types';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { t } from '../src/utils/i18n';
import { useLanguage } from '../src/utils/LanguageContext';
import { useTheme, useThemeColors } from '../src/utils/ThemeContext';
import { ThemeMode } from '../src/theme/colors';
import { NotificationService } from '../src/services/NotificationService';
import { showRewardedAd, adsAvailable } from '../src/services/AdService';
import { IAPService } from '../src/services/IAPService';

const DEFAULT_SETTINGS: GameSettings = {
  sound: true,
  music: true,
  vibration: true,
  language: 'sw',
  notifications: true,
  themeMode: 'dark',
};

export default function SettingsScreen() {
  const router = useRouter();
  const { language, setLang } = useLanguage();
  const { themeMode, setThemeMode } = useTheme();
  const colors = useThemeColors();
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [adFree, setAdFree] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [iapLoading, setIapLoading] = useState(false);

  useEffect(() => {
    StorageService.getSettings().then(setSettings);
    NotificationService.hasPermission().then(async (granted) => {
      if (granted) {
        const scheduled = await NotificationService.isDailyReminderScheduled();
        setNotifEnabled(scheduled);
      }
    });
    IAPService.isAdFree().then(setAdFree);
  }, [language]);

  const updateSetting = async (key: keyof GameSettings, value: boolean | string) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    if (key === 'language') {
      await setLang(value as 'sw' | 'en');
    } else if (key === 'themeMode') {
      await setThemeMode(value as ThemeMode);
    } else {
      await StorageService.saveSettings(updated);
    }
  };

  const handleReset = () => {
    Alert.alert(
      t('resetProgress'),
      t('resetConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          style: 'destructive',
          onPress: async () => {
            await StorageService.resetAllData();
            setSettings(DEFAULT_SETTINGS);
            await setThemeMode(DEFAULT_SETTINGS.themeMode);
            await setLang(DEFAULT_SETTINGS.language);
            Alert.alert('✅', t('resetSuccess'));
            router.replace('/home');
          },
        },
      ]
    );
  };

  const SettingRow = ({
    label,
    emoji,
    value,
    onToggle,
  }: {
    label: string;
    emoji: string;
    value: boolean;
    onToggle: (v: boolean) => void;
  }) => (
    <View style={styles.settingRow}>
      <Text style={styles.settingEmoji}>{emoji}</Text>
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + '88' }}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.backgroundCardLight }]}>
            <Text style={[styles.backIcon, { color: colors.text }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>⚙️ {t('settings')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Sound & Vibration */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>🔊 {t('sound')} & {t('vibration')}</Text>
          <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <SettingRow
              label={t('sound')}
              emoji="🎵"
              value={settings.sound}
              onToggle={(v) => updateSetting('sound', v)}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingRow
              label={t('music')}
              emoji="🎶"
              value={settings.music ?? true}
              onToggle={(v) => updateSetting('music', v)}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingRow
              label={t('vibration')}
              emoji="📳"
              value={settings.vibration}
              onToggle={(v) => updateSetting('vibration', v)}
            />
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>◐ {t('appearance')}</Text>
          <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <View style={styles.langRow}>
              {(['dark', 'light'] as ThemeMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.langBtn,
                    { backgroundColor: colors.backgroundCardLight, borderColor: colors.border },
                    themeMode === mode && { backgroundColor: colors.primary + '22', borderColor: colors.primary },
                  ]}
                  onPress={() => updateSetting('themeMode', mode)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: themeMode === mode }}
                  accessibilityLabel={mode === 'dark' ? t('darkMode') : t('lightMode')}
                >
                  <Text style={styles.langFlag}>{mode === 'dark' ? '🌙' : '☀️'}</Text>
                  <Text
                    style={[
                      styles.langText,
                      { color: colors.textSecondary },
                      themeMode === mode && { color: colors.primary, fontWeight: Typography.fontWeights.bold },
                    ]}
                  >
                    {mode === 'dark' ? t('darkMode') : t('lightMode')}
                  </Text>
                  {themeMode === mode && (
                    <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Language */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>🌍 {t('language')}</Text>
          <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <View style={styles.langRow}>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  { backgroundColor: colors.backgroundCardLight, borderColor: colors.border },
                  language === 'sw' && { backgroundColor: colors.primary + '22', borderColor: colors.primary },
                ]}
                onPress={() => updateSetting('language', 'sw')}
                accessibilityRole="radio"
                accessibilityState={{ selected: language === 'sw' }}
                accessibilityLabel={t('swahili')}
              >
                <Text style={styles.langFlag}>🇹🇿</Text>
                <Text
                  style={[
                    styles.langText,
                    { color: colors.textSecondary },
                    language === 'sw' && { color: colors.primary, fontWeight: Typography.fontWeights.bold },
                  ]}
                >
                  {t('swahili')}
                </Text>
                {language === 'sw' && (
                  <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.langBtn,
                  { backgroundColor: colors.backgroundCardLight, borderColor: colors.border },
                  language === 'en' && { backgroundColor: colors.primary + '22', borderColor: colors.primary },
                ]}
                onPress={() => updateSetting('language', 'en')}
                accessibilityRole="radio"
                accessibilityState={{ selected: language === 'en' }}
                accessibilityLabel={t('english')}
              >
                <Text style={styles.langFlag}>🇬🇧</Text>
                <Text
                  style={[
                    styles.langText,
                    { color: colors.textSecondary },
                    language === 'en' && { color: colors.primary, fontWeight: Typography.fontWeights.bold },
                  ]}
                >
                  {t('english')}
                </Text>
                {language === 'en' && (
                  <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications */}
          {Platform.OS !== 'web' && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>🔔 {language === 'sw' ? 'Arifa' : 'Notifications'}</Text>
              <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingEmoji}>📅</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      {language === 'sw' ? 'Kikumbusha cha Kila Siku' : 'Daily Challenge Reminder'}
                    </Text>
                    <Text style={[styles.comingSoon, { color: colors.textMuted }]}>
                      {language === 'sw' ? 'Saa 7 jioni (19:00)' : '7 PM daily (19:00)'}
                    </Text>
                  </View>
                  <Switch
                    value={notifEnabled}
                    onValueChange={async (v) => {
                      if (v) {
                        const granted = await NotificationService.requestPermission();
                        if (!granted) {
                          Alert.alert(
                            language === 'sw' ? 'Ruhusa inahitajika' : 'Permission required',
                            language === 'sw'
                              ? 'Tafadhali ruhusu arifa katika mipangilio ya simu yako.'
                              : 'Please allow notifications in your phone settings.'
                          );
                          return;
                        }
                        await NotificationService.scheduleDailyReminder({ hour: 19, minute: 0 });
                      } else {
                        await NotificationService.cancelDailyReminder();
                      }
                      setNotifEnabled(v);
                    }}
                    trackColor={{ false: colors.border, true: colors.primary + '88' }}
                    thumbColor={notifEnabled ? colors.primary : colors.textMuted}
                  />
                </View>
              </View>
            </>
          )}

          {/* Premium */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>💎 Premium</Text>
          <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            {adsAvailable() && !adFree ? (
              <>
                <TouchableOpacity
                  style={[styles.premiumRow, adLoading && { opacity: 0.5 }]}
                  disabled={adLoading}
                  onPress={async () => {
                    setAdLoading(true);
                    const reward = await showRewardedAd('extra-life');
                    setAdLoading(false);
                    if (reward) {
                      Alert.alert('🎁', language === 'sw' ? 'Umepata maisha ya ziada!' : 'You earned an extra life!');
                    }
                  }}
                >
                  <Text style={styles.settingEmoji}>🎁</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      {language === 'sw' ? 'Tazama Tangazo — Pata Maisha' : 'Watch Ad — Get Extra Life'}
                    </Text>
                  </View>
                  <Text style={styles.lockIcon}>{adLoading ? '⏳' : '▶'}</Text>
                </TouchableOpacity>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                  style={[styles.premiumRow, adLoading && { opacity: 0.5 }]}
                  disabled={adLoading}
                  onPress={async () => {
                    setAdLoading(true);
                    const reward = await showRewardedAd('double-coins');
                    setAdLoading(false);
                    if (reward) {
                      Alert.alert('🪙', language === 'sw' ? 'Sarafu mara mbili kwenye mchezo ujao!' : 'Double coins on your next game!');
                    }
                  }}
                >
                  <Text style={styles.settingEmoji}>🪙</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      {language === 'sw' ? 'Tazama Tangazo — Sarafu Mara Mbili' : 'Watch Ad — Double Coins'}
                    </Text>
                  </View>
                  <Text style={styles.lockIcon}>{adLoading ? '⏳' : '▶'}</Text>
                </TouchableOpacity>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </>
            ) : null}

            {adFree ? (
              <View style={styles.premiumRow}>
                <Text style={styles.settingEmoji}>✅</Text>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {language === 'sw' ? 'Matangazo yameondolewa — Asante!' : 'Ads removed — Thank you!'}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.premiumRow, iapLoading && { opacity: 0.5 }]}
                disabled={iapLoading || Platform.OS === 'web'}
                onPress={async () => {
                  setIapLoading(true);
                  const ok = await IAPService.purchaseRemoveAds();
                  setIapLoading(false);
                  if (ok) {
                    setAdFree(true);
                    Alert.alert('⭐', language === 'sw' ? 'Matangazo yameondolewa!' : 'Ads removed successfully!');
                  }
                }}
              >
                <Text style={styles.settingEmoji}>⭐</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {language === 'sw' ? 'Ondoa Matangazo' : 'Remove Ads'}
                  </Text>
                  {Platform.OS === 'web' && (
                    <Text style={[styles.comingSoon, { color: colors.textMuted }]}>
                      {language === 'sw' ? 'Inapatikana kwenye app peke yake' : 'Available in the app only'}
                    </Text>
                  )}
                </View>
                <Text style={styles.lockIcon}>{iapLoading ? '⏳' : Platform.OS === 'web' ? '🔒' : '›'}</Text>
              </TouchableOpacity>
            )}

            {!adFree && Platform.OS !== 'web' && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                  style={[styles.premiumRow, iapLoading && { opacity: 0.5 }]}
                  disabled={iapLoading}
                  onPress={async () => {
                    setIapLoading(true);
                    const restored = await IAPService.restorePurchases();
                    setIapLoading(false);
                    if (restored) {
                      setAdFree(true);
                      Alert.alert('✅', language === 'sw' ? 'Manunuzi yamerudishwa!' : 'Purchases restored!');
                    } else {
                      Alert.alert('', language === 'sw' ? 'Hakuna manunuzi ya kurejesha.' : 'No purchases found to restore.');
                    }
                  }}
                >
                  <Text style={styles.settingEmoji}>🔄</Text>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {language === 'sw' ? 'Rejesha Manunuzi' : 'Restore Purchases'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* About */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ℹ️ {t('about')}</Text>
          <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Text style={[styles.aboutText, { color: colors.textSecondary }]}>{t('aboutText')}</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutMeta, { color: colors.textSecondary }]}>📱 {language === 'sw' ? 'Toleo' : 'Version'}</Text>
              <Text style={[styles.aboutMetaVal, { color: colors.text }]}>v{packageJson.version}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.madeWith, { color: colors.textMuted }]}>🤍 {language === 'sw' ? 'Imetengenezwa kwa Tanzania' : 'Made with ❤️ in Tanzania'}</Text>
          </View>

          {/* Reset */}
          <TouchableOpacity style={[styles.resetBtn, { backgroundColor: colors.accent + '22', borderColor: colors.accent }]} onPress={handleReset}>
            <Text style={[styles.resetText, { color: colors.accent }]}>🗑️ {t('resetProgress')}</Text>
          </TouchableOpacity>
        </ScrollView>
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
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  sectionLabel: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  settingEmoji: { fontSize: 22, width: 30 },
  settingLabel: {
    flex: 1,
    fontSize: Typography.fontSizes.md,
    color: Colors.text,
    fontWeight: Typography.fontWeights.medium,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.base },
  langRow: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  langBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCardLight,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  langBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '22',
  },
  langFlag: { fontSize: 20 },
  langText: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.medium,
  },
  langTextActive: { color: Colors.primary, fontWeight: Typography.fontWeights.bold },
  checkmark: {
    fontSize: Typography.fontSizes.md,
    color: Colors.primary,
    fontWeight: Typography.fontWeights.bold,
  },
  premiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  comingSoon: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  lockIcon: { fontSize: 18 },
  aboutText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.textSecondary,
    padding: Spacing.base,
    lineHeight: Typography.fontSizes.md * 1.8,
  },
  resetBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.accent + '22',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.accent,
    padding: Spacing.base,
    alignItems: 'center',
  },
  resetText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.accent,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  aboutMeta: {
    fontSize: Typography.fontSizes.md,
    color: Colors.textSecondary,
  },
  aboutMetaVal: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.text,
  },
  madeWith: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
});
