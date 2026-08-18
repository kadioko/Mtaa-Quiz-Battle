import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
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

export default function CategoriesScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<DiffFilter>('all');
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});
  const columns = width >= 720 ? 3 : 2;
  const gridWidth = Math.min(width, 760);
  const cardWidth = (gridWidth - Spacing.base * 2 - Spacing.sm * (columns - 1)) / columns;

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

  const renderItem = useCallback(({ item, index }: { item: Category; index: number }) => {
    const playCount = playCounts[item.id] ?? 0;
    return (
      <AnimatedCategoryCard
        item={item}
        index={index}
        playCount={playCount}
        language={language}
        colors={colors}
        cardWidth={cardWidth}
        onPress={() => router.push({ pathname: '/quiz', params: { categoryId: item.id } })}
      />
    );
  }, [playCounts, language, colors, router]);


  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.backgroundCardLight }]} accessibilityRole="button" accessibilityLabel={t('backHome')}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('selectCategory')}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <Text style={[styles.searchIcon, { color: colors.textMuted }]}>⌕</Text>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.backgroundCardLight, borderColor: colors.border, color: colors.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder={language === 'sw' ? 'Tafuta kundi...' : 'Search category...'}
            placeholderTextColor={colors.textMuted}
            clearButtonMode="while-editing"
            accessibilityLabel={language === 'sw' ? 'Tafuta kundi' : 'Search category'}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} style={styles.clearSearch} accessibilityRole="button" accessibilityLabel={language === 'sw' ? 'Futa utafutaji' : 'Clear search'}>
              <Text style={[styles.clearSearchText, { color: colors.textMuted }]}>×</Text>
            </Pressable>
          )}
        </View>

        {/* Difficulty chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {(['all', 'easy', 'medium', 'hard'] as DiffFilter[]).map((d) => (
            <Pressable
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
              accessibilityRole="tab"
              accessibilityState={{ selected: diffFilter === d }}
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
            </Pressable>
          ))}
        </ScrollView>

        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          key={columns}
          numColumns={columns}
          contentContainerStyle={[styles.list, { width: gridWidth }]}
          style={styles.listContainer}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          extraData={playCounts}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={[styles.listMeta, { color: colors.textMuted }]}>{t('categoriesAvailable', { count: filtered.length })}</Text>
              {search || diffFilter !== 'all' ? (
                <Text style={[styles.listMeta, { color: colors.primary }]}>{language === 'sw' ? 'Imechujwa' : 'Filtered'}</Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <View style={[styles.emptyState, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <Text style={styles.emptyEmoji}>⌕</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noCategoriesFound')}</Text>
              <Pressable onPress={() => { setSearch(''); setDiffFilter('all'); }} accessibilityRole="button">
                <Text style={[styles.emptyReset, { color: colors.primary }]}>{language === 'sw' ? 'Onyesha yote' : 'Show all'}</Text>
              </Pressable>
            </View>
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

// ── AnimatedCategoryCard ─────────────────────────────────────────────────────
function AnimatedCategoryCard({
  item, index, playCount, language, colors, cardWidth, onPress,
}: {
  item: Category;
  index: number;
  playCount: number;
  language: string;
  colors: any;
  cardWidth: number;
  onPress: () => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(32);

  useEffect(() => {
    const delay = index * 55;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 320, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            width: cardWidth,
            backgroundColor: colors.backgroundCard,
            borderColor: item.color + '88',
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${language === 'en' ? item.name_en : item.name}. ${item.questionCount} ${t('questions')}`}
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
            <Text style={[styles.countText, { color: colors.textSecondary }]}>
              {item.questionCount} {t('questions')}
            </Text>
          </View>
          {playCount > 0 && (
            <View style={[styles.playedBadge, { backgroundColor: item.color + '22' }]}>
              <Text style={[styles.playedText, { color: item.color }]}>{playCount}×</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
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
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: { position: 'absolute', left: Spacing.xl, fontSize: 22, zIndex: 1 },
  searchInput: {
    backgroundColor: Colors.backgroundCardLight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: Typography.fontSizes.md,
    paddingLeft: Spacing.xxl,
    paddingRight: Spacing.xl,
    minHeight: 46,
  },
  clearSearch: { position: 'absolute', right: Spacing.xl, padding: Spacing.sm, zIndex: 1 },
  clearSearchText: { fontSize: 24, lineHeight: 24 },
  listContainer: { alignSelf: 'center', width: '100%' },
  list: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
    alignSelf: 'center',
  },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: Spacing.sm },
  listMeta: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semiBold },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    padding: Spacing.base,
    alignItems: 'center',
    minHeight: 196,
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
    borderRadius: Radius.md,
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
  emptyState: {
    marginTop: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyEmoji: { fontSize: 30 },
  emptyText: { fontSize: Typography.fontSizes.md, textAlign: 'center' },
  emptyReset: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold, paddingTop: Spacing.xs },
});
