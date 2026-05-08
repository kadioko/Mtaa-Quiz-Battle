import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';

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
  const getBgColor = () => {
    switch (state) {
      case 'correct': return Colors.correct;
      case 'wrong':   return Colors.wrong;
      case 'reveal':  return Colors.correct;
      default:        return Colors.backgroundCardLight;
    }
  };

  const getBorderColor = () => {
    switch (state) {
      case 'correct': return Colors.correct;
      case 'wrong':   return Colors.wrong;
      case 'reveal':  return Colors.correct;
      default:        return Colors.border;
    }
  };

  const getTextColor = () => {
    if (state === 'default') return Colors.text;
    return Colors.white;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        { backgroundColor: getBgColor(), borderColor: getBorderColor() },
      ]}
    >
      <Text style={[styles.optionLabel, { backgroundColor: getBorderColor() }]}>
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
    color: Colors.white,
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
