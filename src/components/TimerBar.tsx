import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Radius } from '../theme';
import { useThemeColors } from '../utils/ThemeContext';

interface Props {
  timeLeft: number;
  totalTime: number;
}

const TimerBar: React.FC<Props> = ({ timeLeft, totalTime }) => {
  const colors = useThemeColors();
  const animWidth = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const ratio = timeLeft / totalTime;
    Animated.timing(animWidth, {
      toValue: ratio,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, totalTime, animWidth]);

  const barColor = animWidth.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [colors.timerLow, colors.timer, colors.secondary],
  });

  return (
    <View style={[styles.track, { backgroundColor: colors.border }]}>
      <Animated.View
        style={[
          styles.bar,
          {
            flex: animWidth,
            backgroundColor: barColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  bar: {
    borderRadius: Radius.full,
  },
});

export default TimerBar;
