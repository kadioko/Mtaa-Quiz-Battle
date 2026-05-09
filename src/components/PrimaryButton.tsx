import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Typography, Spacing, Radius } from '../theme';
import { useThemeColors } from '../utils/ThemeContext';

interface Props {
  label: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const PrimaryButton: React.FC<Props> = ({
  label,
  onPress,
  color,
  textColor,
  style,
  textStyle,
  disabled = false,
  loading = false,
  size = 'lg',
}) => {
  const colors = useThemeColors();
  const sizeStyle = sizeMap[size as keyof typeof sizeMap];
  const resolvedColor = color ?? colors.primary;
  const resolvedTextColor = textColor ?? colors.black;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        sizeStyle.button,
        {
          backgroundColor: disabled ? colors.borderLight : resolvedColor,
          shadowColor: colors.black,
          opacity: disabled ? 0.72 : 1,
        },
        style,
      ]}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator color={resolvedTextColor} />
      ) : (
        <Text style={[styles.label, sizeStyle.label, { color: disabled ? colors.text : resolvedTextColor }, textStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const sizeMap = {
  sm: {
    button: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base },
    label: { fontSize: Typography.fontSizes.sm },
  },
  md: {
    button: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
    label: { fontSize: Typography.fontSizes.md },
  },
  lg: {
    button: { paddingVertical: Spacing.base, paddingHorizontal: Spacing.xxl },
    label: { fontSize: Typography.fontSizes.lg },
  },
};

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  label: {
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 0.5,
  },
});

export default PrimaryButton;
