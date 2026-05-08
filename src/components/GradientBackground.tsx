import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: [string, string, ...string[]];
}

const GradientBackground: React.FC<Props> = ({
  children,
  style,
  colors = [Colors.gradientStart, Colors.gradientEnd],
}) => {
  return (
    <LinearGradient colors={colors} style={[styles.container, style]}>
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GradientBackground;
