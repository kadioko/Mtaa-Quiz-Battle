import React from 'react';
import {
  Pressable,
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
  icon?: string;
  accessibilityHint?: string;
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
  icon,
  accessibilityHint,
}) => {
  const colors = useThemeColors();
  const sizeStyle = sizeMap[size as keyof typeof sizeMap];
  const resolvedColor = color ?? colors.primary;
  const resolvedTextColor = textColor ?? colors.black;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        sizeStyle.button,
        {
          backgroundColor: disabled ? colors.borderLight : resolvedColor,
          borderColor: disabled ? colors.border : resolvedColor,
          opacity: disabled ? 0.72 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={resolvedTextColor} />
      ) : (
        <Text style={[styles.label, sizeStyle.label, { color: disabled ? colors.text : resolvedTextColor }, textStyle]}>
          {icon ? `${icon}  ` : ''}{label}
        </Text>
      )}
    </Pressable>
  );
};

const sizeMap = {
  sm: {
    button: { minHeight: 36, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base },
    label: { fontSize: Typography.fontSizes.sm },
  },
  md: {
    button: { minHeight: 44, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
    label: { fontSize: Typography.fontSizes.md },
  },
  lg: {
    button: { minHeight: 52, paddingVertical: Spacing.base, paddingHorizontal: Spacing.xxl },
    label: { fontSize: Typography.fontSizes.lg },
  },
};

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 0,
  },
});

export default PrimaryButton;
