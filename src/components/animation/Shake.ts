import { useCallback, useRef } from 'react'
import { Animated } from 'react-native'

export const useShakeAnimation = () => {
	const anim = useRef(new Animated.Value(0))
	const shake = useCallback(() => {
		// makes the sequence loop
		Animated.loop(
			// runs the animation array in sequence
			Animated.sequence([
				// shift element to the left by 2 units
				Animated.timing(anim.current, {
					toValue: -2,
					duration: 40,
					useNativeDriver: true
				}),
				// shift element to the right by 2 units
				Animated.timing(anim.current, {
					toValue: 2,
					duration: 40,
					useNativeDriver: true
				}),
				// bring the element back to its original position
				Animated.timing(anim.current, {
					toValue: 0,
					duration: 40,
					useNativeDriver: true
				}),
			]),
			// loops the above animation config 3 times
			{ iterations: 3 }
		).start()
	}, [])
	return { anim, shake }
}