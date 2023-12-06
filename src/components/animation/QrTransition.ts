import type { RootStackParamList } from '@model/nav'
import { type NavigationProp,useNavigation } from '@react-navigation/core'
import { useThemeContext } from '@src/context/Theme'
import { useRef } from 'react'
import { Animated, Easing } from 'react-native'

type StackNavigation = NavigationProp<RootStackParamList>

export const useTransitionAnimation = () => {
	const nav = useNavigation<StackNavigation>()
	const { color } = useThemeContext()
	const animatedColorValue = useRef(new Animated.Value(0)).current
	const animatedPositionValue = useRef(new Animated.Value(0)).current
	const animatedOpacityValue = useRef(new Animated.Value(0)).current
	const animatedMarginValue = useRef(new Animated.Value(0)).current
	const animationEnded = useRef(false)
	const interpolatedColor = animatedColorValue.interpolate({
		inputRange: animationEnded.current ? [1, 0] : [0, 1],
		outputRange: animationEnded.current ? ['#000', color.BACKGROUND] : [color.BACKGROUND, '#000'],
	})
	const interpolatedPosition = animatedPositionValue.interpolate({
		inputRange: animationEnded.current ? [1, 0] : [0, 1],
		outputRange: animationEnded.current ? [100, 0] : [0, 100],
	})
	const interpolatedOpacity = animatedOpacityValue.interpolate({
		inputRange: animationEnded.current ? [1, 0] : [0, 1],
		outputRange: animationEnded.current ? [0, 1] : [1, 0],
	})
	const interpolatedMargin = animatedMarginValue.interpolate({
		inputRange: animationEnded.current ? [1, 0] : [0, 1],
		outputRange: animationEnded.current ? [-1000, 0] : [0, -1000],
	})
	const animatedBgStyles = {
		backgroundColor: interpolatedColor,
	}
	const animatedPosStyles = {
		transform: [{ translateY: interpolatedPosition }],
	}
	const animatedOpacityStyles = {
		opacity: interpolatedOpacity,
	}
	const animatedMarginStyles = {
		marginTop: interpolatedMargin,
	}
	const animateTransition = () => {
		Animated.parallel([
			Animated.timing(animatedColorValue, {
				toValue: animationEnded.current ? 0 : 1,
				duration: 300,
				easing: Easing.linear,
				useNativeDriver: false,
			}),
			Animated.timing(animatedPositionValue, {
				toValue: animationEnded.current ? 0 : 1,
				duration: 300,
				easing: Easing.linear,
				useNativeDriver: false,
			}),
			Animated.timing(animatedOpacityValue, {
				toValue: animationEnded.current ? 0 : 1,
				duration: 150,
				easing: Easing.linear,
				useNativeDriver: false,
			}),
			Animated.timing(animatedMarginValue, {
				toValue: animationEnded.current ? 0 : 1,
				duration: 300,
				easing: Easing.linear,
				useNativeDriver: false,
			})
		]).start(() => {
			if (animationEnded.current) { return animationEnded.current = false }
			nav.navigate('qr scan', { mint: undefined })
			animationEnded.current = true
		})
	}
	return {
		animatedBgStyles,
		animatedPosStyles,
		animatedOpacityStyles,
		animatedMarginStyles,
		animationEnded,
		animateTransition,
	}
}