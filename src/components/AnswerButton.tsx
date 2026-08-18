import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Typography, Spacing, Radius } from '../theme';
import { useThemeColors } from '../utils/ThemeContext';

export type AnswerState = 'default' | 'correct' | 'wrong' | 'reveal' | 'eliminated';

interface Props {
  label: string;
  state: AnswerState;
  onPress: () => void;
  disabled: boolean;
  index: number;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const AnswerButton: React.FC<Props> = ({ label, state, onPress, disabled, index }) => {
  const colors = useThemeColors();
  const getBgColor = () => {
    switch (state) {
      case 'correct': return colors.correct;
      case 'wrong':   return colors.wrong;
      case 'reveal':  return colors.correct;
      case 'eliminated': return colors.backgroundCardLight;
      default:        return colors.backgroundCardLight;
    }
  };

  const getBorderColor = () => {
    switch (state) {
      case 'correct': return colors.correct;
      case 'wrong':   return colors.wrong;
      case 'reveal':  return colors.correct;
      case 'eliminated': return colors.border;
      default:        return colors.border;
    }
  };

  const getTextColor = () => {
    if (state === 'default') return colors.text;
    if (state === 'eliminated') return colors.textMuted;
    return '#000000';
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${OPTION_LABELS[index]}. ${label}`}
      accessibilityState={{ disabled, selected: state === 'correct' || state === 'wrong' || state === 'reveal' }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: getBgColor(),
          borderColor: getBorderColor(),
          opacity: state === 'eliminated' ? 0.45 : disabled && state === 'default' ? 0.82 : 1,
          transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
        },
      ]}
    >
      <Text style={[styles.optionLabel, { backgroundColor: getBorderColor(), color: state === 'default' ? colors.white : state === 'eliminated' ? colors.textMuted : '#000000' }]}>
        {OPTION_LABELS[index]}
      </Text>
      <Text style={[styles.text, { color: getTextColor() }]} numberOfLines={3}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    minHeight: 64,
  },
  optionLabel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  text: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.medium,
    flex: 1,
    lineHeight: Typography.fontSizes.md * 1.45,
  },
});

export default AnswerButton;
