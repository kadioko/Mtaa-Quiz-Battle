import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';

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
  color = Colors.primary,
  textColor = Colors.black,
  style,
  textStyle,
  disabled = false,
  loading = false,
  size = 'lg',
}) => {
  const sizeStyle = sizeMap[size as keyof typeof sizeMap];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        sizeStyle.button,
        { backgroundColor: disabled ? Colors.textMuted : color },
        style,
      ]}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, sizeStyle.label, { color: textColor }, textStyle]}>
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
    shadowColor: Colors.black,
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
