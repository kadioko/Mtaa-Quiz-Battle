import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';

interface Props {
  label: string;
  value: string | number;
  emoji?: string;
  color?: string;
}

const StatCard: React.FC<Props> = ({ label, value, emoji, color = Colors.primary }) => {
  return (
    <View style={[styles.card, { borderColor: color }]}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    minWidth: 90,
    flex: 1,
    marginHorizontal: Spacing.xs,
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
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default StatCard;
