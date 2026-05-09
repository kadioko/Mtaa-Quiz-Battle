import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categories } from '../src/data/categories';
import { getQuestionsByCategory } from '../src/data/questions';
import { StorageService } from '../src/storage/storage';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { t } from '../src/utils/i18n';
import { useLanguage } from '../src/utils/LanguageContext';
import { Category } from '../src/types';
import { useThemeColors } from '../src/utils/ThemeContext';

type DiffFilter = 'all' | 'easy' | 'medium' | 'hard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.base * 2 - Spacing.sm) / 2;

export default function CategoriesScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const colors = useThemeColors();
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<DiffFilter>('all');
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    StorageService.getCategoryStats().then(setPlayCounts);
  }, []);

  const filtered = categories.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = q === '' || c.name.toLowerCase().includes(q) || c.name_en.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (diffFilter === 'all') return true;
    const qs = getQuestionsByCategory(c.name);
    return qs.some((question) => question.difficulty === diffFilter);
  });

  const renderItem = ({ item }: { item: Category }) => {
    const playCount = playCounts[item.id] ?? 0;
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: item.color }]}
        onPress={() => router.push({ pathname: '/quiz', params: { categoryId: item.id } })}
        activeOpacity={0.82}
      >
        <View style={[styles.emojiCircle, { backgroundColor: item.color + '22' }]}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
        <Text style={[styles.name, { color: item.color }]} numberOfLines={2}>
          {language === 'en' ? item.name_en : item.name}
        </Text>
        <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={2}>
          {language === 'en' ? item.description_en : item.description}
        </Text>
        <View style={styles.cardFooter}>
          <View style={[styles.countBadge, { backgroundColor: colors.backgroundCardLight }]}>
            <Text style={[styles.countText, { color: colors.textSecondary }]}>{item.questionCount} {t('questions')}</Text>
          </View>
          {playCount > 0 && (
            <View style={[styles.playedBadge, { backgroundColor: item.color + '22' }]}>
              <Text style={[styles.playedText, { color: item.color }]}>
                {language === 'sw' ? `${playCount}×` : `${playCount}×`}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.backgroundCardLight }]}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('selectCategory')}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.backgroundCardLight, borderColor: colors.border, color: colors.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder={language === 'sw' ? 'Tafuta kundi...' : 'Search category...'}
            placeholderTextColor={colors.textMuted}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Difficulty chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {(['all', 'easy', 'medium', 'hard'] as DiffFilter[]).map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.chip,
                { backgroundColor: colors.backgroundCardLight, borderColor: colors.border },
                diffFilter === d && styles.chipActive,
                diffFilter === d && {
                  backgroundColor:
                    d === 'easy' ? colors.secondary + '33' :
                    d === 'medium' ? colors.timer + '33' :
                    d === 'hard' ? colors.accent + '33' :
                    colors.primary + '33',
                  borderColor:
                    d === 'easy' ? colors.secondary :
                    d === 'medium' ? colors.timer :
                    d === 'hard' ? colors.accent :
                    colors.primary,
                },
              ]}
              onPress={() => setDiffFilter(d)}
            >
              <Text style={[
                styles.chipText,
                { color: colors.textMuted },
                diffFilter === d && {
                  color:
                    d === 'easy' ? colors.secondary :
                    d === 'medium' ? colors.timer :
                    d === 'hard' ? colors.accent :
                    colors.primary,
                },
              ]}>
                {d === 'all'
                  ? (language === 'sw' ? 'Zote' : 'All')
                  : d === 'easy' ? t('easyLevel')
                  : d === 'medium' ? t('mediumLevel')
                  : t('hardLevel')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
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
  backIcon: {
    fontSize: 28,
    color: Colors.text,
    lineHeight: 32,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text,
  },
  searchRow: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  searchInput: {
    backgroundColor: Colors.backgroundCardLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: Typography.fontSizes.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  list: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.base,
    alignItems: 'center',
  },
  emojiCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  emoji: { fontSize: 28 },
  name: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  desc: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  countBadge: {
    backgroundColor: Colors.backgroundCardLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  countText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
  },
  playedBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  playedText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
  },
  chipsRow: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCardLight,
  },
  chipActive: {
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.textMuted,
  },
});
