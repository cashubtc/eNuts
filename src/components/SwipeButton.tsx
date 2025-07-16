import { useThemeContext } from '@src/context/Theme'
import { highlight as hi,mainColors } from '@styles'
import { useState } from 'react'
import { Dimensions, View } from 'react-native'
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler'
import Animated, { Extrapolation, interpolate, interpolateColor, runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { ScaledSheet } from 'react-native-size-matters'

import { ChevronRightIcon } from './Icons'

const { width } = Dimensions.get('window')
const BUTTON_PADDING = 10
const BUTTON_WIDTH = width - 40
const BUTTON_HEIGHT = 72
const SWIPEABLE_DIMENSIONS = BUTTON_HEIGHT - 2 * BUTTON_PADDING

const H_WAVE_RANGE = SWIPEABLE_DIMENSIONS + 2 * BUTTON_PADDING
const H_SWIPE_RANGE = BUTTON_WIDTH - 2 * BUTTON_PADDING - SWIPEABLE_DIMENSIONS
const SPRING_CONFIG = {
	mass: 1,
	damping: 75,
	stiffness: 250,
	overshootClamping: true,
	restDisplacementThreshold: .01,
	restSpeedThreshold: 2.8
}
const AnimatedView = Animated.createAnimatedComponent(View)

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type TGestureContext = {
	completed: boolean
}

interface ISwipeButtonProps {
	txt: string
	onToggle: (isToggled: boolean) => void
}

export default function SwipeButton({ txt, onToggle }: ISwipeButtonProps) {

	const { color, highlight } = useThemeContext()
	const X = useSharedValue(0)
	const [toggled, setToggled] = useState(false)

	const handleComplete = (isToggled: boolean) => {
		if (isToggled !== toggled) {
			setToggled(isToggled)
			if (!isToggled) { return }
			onToggle(isToggled)
		}
	}

	// Gesture Handler Events // TODO update this deprecated method
	const animatedGestureHandler = useAnimatedGestureHandler({
		onStart: (_, ctx: TGestureContext) => {
			ctx.completed = toggled
		},
		onActive: (e, ctx: TGestureContext) => {
			let newValue
			if (ctx.completed) {
				newValue = H_SWIPE_RANGE + e.translationX
			} else {
				newValue = e.translationX
			}
			if (newValue >= 0 && newValue <= H_SWIPE_RANGE) {
				X.value = newValue
			}
		},
		onEnd: () => {
			if (X.value < BUTTON_WIDTH / 2 - SWIPEABLE_DIMENSIONS / 2) {
				X.value = withSpring(0, SPRING_CONFIG)
				runOnJS(handleComplete)(false)
			} else {
				X.value = withSpring(H_SWIPE_RANGE, SPRING_CONFIG)
				runOnJS(handleComplete)(true)
			}
		},
	})

	const InterpolateXInput = [0, H_SWIPE_RANGE]
	const AnimatedStyles = {
		swipeCont: useAnimatedStyle(() => ({})),
		colorWave: useAnimatedStyle(() => ({
			width: H_WAVE_RANGE + X.value,
			opacity: interpolate(X.value, InterpolateXInput, [0, 1]),
		})),
		swipeable: useAnimatedStyle(() => ({
			backgroundColor: interpolateColor(
				X.value,
				[0, BUTTON_WIDTH - SWIPEABLE_DIMENSIONS - BUTTON_PADDING],
				[hi[highlight], mainColors.WHITE],
			),
			transform: [{ translateX: X.value }],
		})),
		swipeText: useAnimatedStyle(() => ({
			opacity: interpolate(
				X.value * 2,
				InterpolateXInput,
				[1, 0],
				Extrapolation.CLAMP,
			),
			transform: [{
				translateX: interpolate(
					X.value,
					InterpolateXInput,
					[0, BUTTON_WIDTH / 2 - SWIPEABLE_DIMENSIONS],
					Extrapolation.CLAMP,
				),
			}],
		})),
	}

	return (
		<View style={styles.container}>
			<GestureHandlerRootView>
				<Animated.View style={[styles.swipeCont, AnimatedStyles.swipeCont, { backgroundColor: color.INPUT_BG }]}>
					<AnimatedView style={[AnimatedStyles.colorWave, styles.colorWave, { backgroundColor: hi[highlight] }]} />
					<PanGestureHandler onGestureEvent={animatedGestureHandler} testID='swipe-confirm-button'>
						<Animated.View style={[styles.swipeable, AnimatedStyles.swipeable, { borderColor: color.INPUT_PH }]}>
							<ChevronRightIcon color={mainColors.WHITE} />
						</Animated.View>
					</PanGestureHandler>
					<Animated.Text style={[styles.swipeText, AnimatedStyles.swipeText, { color: color.TEXT }]}>
						{txt}
					</Animated.Text>
				</Animated.View>
			</GestureHandlerRootView>
		</View>
	)
}

const styles = ScaledSheet.create({
	container: {
		paddingHorizontal: '20@s',
		paddingTop: '5@s',
	},
	swipeCont: {
		height: BUTTON_HEIGHT,
		width: BUTTON_WIDTH,
		borderRadius: BUTTON_HEIGHT,
		padding: BUTTON_PADDING,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'row',
	},
	colorWave: {
		position: 'absolute',
		left: 0,
		height: BUTTON_HEIGHT,
		borderRadius: BUTTON_HEIGHT,
	},
	swipeable: {
		position: 'absolute',
		left: BUTTON_PADDING,
		height: SWIPEABLE_DIMENSIONS,
		width: SWIPEABLE_DIMENSIONS,
		borderRadius: SWIPEABLE_DIMENSIONS,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 3,
		borderWidth: 5,
	},
	swipeText: {
		alignSelf: 'center',
		fontSize: '14@vs',
		fontWeight: '500',
		zIndex: 2,
	},
})