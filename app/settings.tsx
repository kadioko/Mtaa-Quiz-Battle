import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '../src/storage/storage';
import { GameSettings } from '../src/types';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { t } from '../src/utils/i18n';
import { useLanguage } from '../src/utils/LanguageContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { language, setLang } = useLanguage();
  const [settings, setSettings] = useState<GameSettings>({
    sound: true,
    vibration: true,
    language: 'sw',
    notifications: true,
  });

  useEffect(() => {
    StorageService.getSettings().then(setSettings);
  }, [language]);

  const updateSetting = async (key: keyof GameSettings, value: boolean | string) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    if (key === 'language') {
      await setLang(value as 'sw' | 'en');
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
            Alert.alert('✅', t('resetSuccess'));
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
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.border, true: Colors.primary + '88' }}
        thumbColor={value ? Colors.primary : Colors.textMuted}
      />
    </View>
  );

  return (
    <LinearGradient colors={['#0F0F23', '#1A1A35']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⚙️ {t('settings')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Sound & Vibration */}
          <Text style={styles.sectionLabel}>🔊 {t('sound')} & {t('vibration')}</Text>
          <View style={styles.card}>
            <SettingRow
              label={t('sound')}
              emoji="🎵"
              value={settings.sound}
              onToggle={(v) => updateSetting('sound', v)}
            />
            <View style={styles.divider} />
            <SettingRow
              label={t('vibration')}
              emoji="📳"
              value={settings.vibration}
              onToggle={(v) => updateSetting('vibration', v)}
            />
          </View>

          {/* Language */}
          <Text style={styles.sectionLabel}>🌍 {t('language')}</Text>
          <View style={styles.card}>
            <View style={styles.langRow}>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  language === 'sw' && styles.langBtnActive,
                ]}
                onPress={() => updateSetting('language', 'sw')}
              >
                <Text style={styles.langFlag}>🇹🇿</Text>
                <Text
                  style={[
                    styles.langText,
                    language === 'sw' && styles.langTextActive,
                  ]}
                >
                  {t('swahili')}
                </Text>
                {language === 'sw' && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.langBtn,
                  language === 'en' && styles.langBtnActive,
                ]}
                onPress={() => updateSetting('language', 'en')}
              >
                <Text style={styles.langFlag}>🇬🇧</Text>
                <Text
                  style={[
                    styles.langText,
                    language === 'en' && styles.langTextActive,
                  ]}
                >
                  {t('english')}
                </Text>
                {language === 'en' && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Monetization placeholders */}
          <Text style={styles.sectionLabel}>💎 Premium</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.premiumRow} disabled>
              <Text style={styles.settingEmoji}>🎁</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>
                  {settings.language === 'sw' ? 'Tazama Tangazo - Pata Maisha' : 'Watch Ad - Get Extra Life'}
                </Text>
                <Text style={styles.comingSoon}>
                  {settings.language === 'sw' ? 'Inakuja hivi karibuni' : 'Coming soon'}
                </Text>
              </View>
              <Text style={styles.lockIcon}>🔒</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.premiumRow} disabled>
              <Text style={styles.settingEmoji}>🪙</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>
                  {settings.language === 'sw' ? 'Tazama Tangazo - Sarafu Mara Mbili' : 'Watch Ad - Double Coins'}
                </Text>
                <Text style={styles.comingSoon}>
                  {settings.language === 'sw' ? 'Inakuja hivi karibuni' : 'Coming soon'}
                </Text>
              </View>
              <Text style={styles.lockIcon}>🔒</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.premiumRow} disabled>
              <Text style={styles.settingEmoji}>⭐</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>
                  {settings.language === 'sw' ? 'Ondoa Matangazo' : 'Remove Ads'}
                </Text>
                <Text style={styles.comingSoon}>
                  {settings.language === 'sw' ? 'Inakuja hivi karibuni' : 'Coming soon'}
                </Text>
              </View>
              <Text style={styles.lockIcon}>🔒</Text>
            </TouchableOpacity>
          </View>

          {/* About */}
          <Text style={styles.sectionLabel}>ℹ️ {t('about')}</Text>
          <View style={styles.card}>
            <Text style={styles.aboutText}>{t('aboutText')}</Text>
          </View>

          {/* Reset */}
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetText}>🗑️ {t('resetProgress')}</Text>
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
    letterSpacing: 1,
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
    opacity: 0.6,
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
});
