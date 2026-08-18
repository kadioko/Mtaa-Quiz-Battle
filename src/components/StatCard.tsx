import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing, Radius } from '../theme';
import { useThemeColors } from '../utils/ThemeContext';

interface Props {
  label: string;
  value: string | number;
  emoji?: string;
  color?: string;
}

const StatCard: React.FC<Props> = ({ label, value, emoji, color }) => {
  const colors = useThemeColors();
  const accentColor = color ?? colors.primary;
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
    >
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    padding: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    minWidth: 90,
    flex: 1,
    marginHorizontal: Spacing.xs,
    overflow: 'hidden',
  },
  accent: {
    height: 3,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  emoji: {
    fontSize: 22,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.extraBold,
    marginBottom: 2,
  },
  label: {
    fontSize: Typography.fontSizes.xs,
    textAlign: 'center',
    lineHeight: Typography.fontSizes.xs * 1.35,
  },
});

export default StatCard;
