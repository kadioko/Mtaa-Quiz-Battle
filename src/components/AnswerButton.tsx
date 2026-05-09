import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Typography, Spacing, Radius } from '../theme';
import { useThemeColors } from '../utils/ThemeContext';

export type AnswerState = 'default' | 'correct' | 'wrong' | 'reveal';

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
      default:        return colors.backgroundCardLight;
    }
  };

  const getBorderColor = () => {
    switch (state) {
      case 'correct': return colors.correct;
      case 'wrong':   return colors.wrong;
      case 'reveal':  return colors.correct;
      default:        return colors.border;
    }
  };

  const getTextColor = () => {
    if (state === 'default') return colors.text;
    return '#000000';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: getBgColor(),
          borderColor: getBorderColor(),
          opacity: disabled && state === 'default' ? 0.82 : 1,
        },
      ]}
    >
      <Text style={[styles.optionLabel, { backgroundColor: getBorderColor(), color: state === 'default' ? colors.white : '#000000' }]}>
        {OPTION_LABELS[index]}
      </Text>
      <Text style={[styles.text, { color: getTextColor() }]} numberOfLines={3}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    minHeight: 56,
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
  },
});

export default AnswerButton;
