import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { Radius } from '../theme';
import { useThemeColors } from '../utils/ThemeContext';

interface Props {
  timeLeft: number;
  totalTime: number;
}

const TimerBar: React.FC<Props> = ({ timeLeft, totalTime }) => {
  const colors = useThemeColors();
  const animWidth = useRef(new Animated.Value(1)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  const ratio = Math.max(0, Math.min(1, totalTime > 0 ? timeLeft / totalTime : 0));

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: ratio,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [ratio, animWidth]);

  const barColor = animWidth.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [colors.timerLow, colors.timer, colors.secondary],
  });

  return (
    <View
      style={[styles.track, { backgroundColor: colors.border }]}
      onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: totalTime, now: Math.max(0, timeLeft) }}
    >
      <Animated.View
        style={[
          styles.bar,
          {
            width: animWidth.interpolate({ inputRange: [0, 1], outputRange: [0, trackWidth] }),
            backgroundColor: barColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  bar: {
    borderRadius: Radius.full,
  },
});

export default TimerBar;
