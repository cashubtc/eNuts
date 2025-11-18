import { useThemeContext } from "@src/context/Theme";
import { highlight as hi, mainColors } from "@styles";
import { useEffect, useImperativeHandle, forwardRef } from "react";
import { View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ScaledSheet } from "react-native-size-matters";

import { ChevronRightIcon } from "./Icons";

const BUTTON_PADDING = 10;
const BUTTON_HEIGHT = 72;
const HORIZONTAL_MARGIN = 20;
const SWIPEABLE_DIMENSIONS = BUTTON_HEIGHT - 2 * BUTTON_PADDING;

const SPRING_CONFIG = {
  mass: 1,
  damping: 75,
  stiffness: 250,
  overshootClamping: true,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 2.8,
};
const AnimatedView = Animated.createAnimatedComponent(View);

interface ISwipeButtonProps {
  txt: string;
  onToggle: (isToggled: boolean) => void;
}

export interface SwipeButtonHandle {
  reset: () => void;
}

function SwipeButton(
  { txt, onToggle }: ISwipeButtonProps,
  ref: React.Ref<SwipeButtonHandle>
) {
  const { color, highlight } = useThemeContext();
  const { width: windowWidth } = useWindowDimensions();
  const X = useSharedValue(0);
  const toggled = useSharedValue(false);

  const BUTTON_WIDTH = windowWidth - HORIZONTAL_MARGIN * 2;
  const H_WAVE_RANGE = SWIPEABLE_DIMENSIONS + 2 * BUTTON_PADDING;
  const H_SWIPE_RANGE =
    BUTTON_WIDTH - 2 * BUTTON_PADDING - SWIPEABLE_DIMENSIONS;
  const SWIPE_THRESHOLD = H_SWIPE_RANGE / 2;

  const handleComplete = (isToggled: boolean) => {
    onToggle(isToggled);
  };

  const reset = () => {
    X.value = withSpring(0, SPRING_CONFIG);
    toggled.value = false;
  };

  useImperativeHandle(ref, () => ({
    reset,
  }));

  useEffect(() => {
    // Reset animation when window dimensions change
    reset();
  }, [windowWidth]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Store the current toggle state at gesture start
    })
    .onUpdate((e) => {
      let newValue;
      if (toggled.value) {
        newValue = H_SWIPE_RANGE + e.translationX;
      } else {
        newValue = e.translationX;
      }
      if (newValue >= 0 && newValue <= H_SWIPE_RANGE) {
        X.value = newValue;
      }
    })
    .onEnd(() => {
      const wasToggled = toggled.value;
      if (X.value < SWIPE_THRESHOLD) {
        X.value = withSpring(0, SPRING_CONFIG);
        toggled.value = false;
      } else {
        X.value = withSpring(H_SWIPE_RANGE, SPRING_CONFIG);
        // Only trigger the callback if we weren't already toggled
        // This means the user just completed the swipe for the first time
        if (!wasToggled) {
          toggled.value = true;
          runOnJS(handleComplete)(true);
        }
      }
    });

  const InterpolateXInput = [0, H_SWIPE_RANGE];
  const AnimatedStyles = {
    colorWave: useAnimatedStyle(() => ({
      width: H_WAVE_RANGE + X.value,
      opacity: interpolate(X.value, InterpolateXInput, [0, 1]),
    })),
    swipeable: useAnimatedStyle(() => ({
      backgroundColor: interpolateColor(
        X.value,
        [0, H_SWIPE_RANGE],
        [hi[highlight], mainColors.WHITE]
      ),
      transform: [{ translateX: X.value }],
    })),
    swipeText: useAnimatedStyle(() => ({
      opacity: interpolate(
        X.value,
        [0, H_SWIPE_RANGE / 2],
        [1, 0],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          translateX: interpolate(
            X.value,
            InterpolateXInput,
            [0, H_SWIPE_RANGE / 2],
            Extrapolation.CLAMP
          ),
        },
      ],
    })),
    chevron: useAnimatedStyle(() => ({
      opacity: interpolate(
        X.value,
        [0, H_SWIPE_RANGE],
        [1, 0],
        Extrapolation.CLAMP
      ),
    })),
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.swipeCont,
          { backgroundColor: color.INPUT_BG, width: BUTTON_WIDTH },
        ]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={txt}
        accessibilityHint="Swipe right to confirm"
      >
        <AnimatedView
          style={[
            AnimatedStyles.colorWave,
            styles.colorWave,
            { backgroundColor: hi[highlight] },
          ]}
        />
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.swipeable,
              AnimatedStyles.swipeable,
              { borderColor: color.INPUT_PH },
            ]}
            testID="swipe-confirm-button"
          >
            <Animated.View style={AnimatedStyles.chevron}>
              <ChevronRightIcon color={mainColors.WHITE} />
            </Animated.View>
          </Animated.View>
        </GestureDetector>
        <Animated.Text
          style={[
            styles.swipeText,
            AnimatedStyles.swipeText,
            { color: color.TEXT },
          ]}
        >
          {txt}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

export default forwardRef(SwipeButton);

const styles = ScaledSheet.create({
  container: {
    paddingHorizontal: "20@s",
    paddingTop: "5@s",
  },
  swipeCont: {
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_HEIGHT,
    padding: BUTTON_PADDING,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  colorWave: {
    position: "absolute",
    left: 0,
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_HEIGHT,
  },
  swipeable: {
    position: "absolute",
    left: BUTTON_PADDING,
    height: SWIPEABLE_DIMENSIONS,
    width: SWIPEABLE_DIMENSIONS,
    borderRadius: SWIPEABLE_DIMENSIONS,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    borderWidth: 5,
  },
  swipeText: {
    alignSelf: "center",
    fontSize: "14@vs",
    fontWeight: "500",
    zIndex: 2,
  },
});
