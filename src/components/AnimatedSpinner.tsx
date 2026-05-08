import { Stack } from "@styles";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface IAnimatedSpinnerProps {
  color: string;
  size?: number;
}

export default function AnimatedSpinner({ color, size = 24 }: IAnimatedSpinnerProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1, // infinite
      false,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const dotSize = size / 5;
  const radius = (size - dotSize) / 2;

  // Create 8 dots around a circle with varying opacity
  const dots = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 360) / 8;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);
    const opacity = 0.2 + (i / 8) * 0.8; // Gradient effect

    return (
      <Stack
        key={i}
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
            opacity,
            transform: [{ translateX: x }, { translateY: y }],
          },
        ]}
      />
    );
  });

  return (
    <Stack style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.spinner, animatedStyle]}>{dots}</Animated.View>
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    position: "absolute",
  },
});
