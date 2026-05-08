import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Radius } from '../theme';

interface Props {
  timeLeft: number;
  totalTime: number;
}

const TimerBar: React.FC<Props> = ({ timeLeft, totalTime }) => {
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
    outputRange: [Colors.timerLow, Colors.timer, Colors.secondary],
  });

  return (
    <View style={styles.track}>
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
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  bar: {
    borderRadius: Radius.full,
  },
});

export default TimerBar;
