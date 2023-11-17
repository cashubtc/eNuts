import { useCallback, useEffect, useMemo, useState } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'

export default function QRMarker({ size, color }: { size: number, color: string }) {

	const [animatedSize] = useState(new Animated.Value(size))

	const animationConfig = useMemo(() => ({
		toValue: size * 1.1,
		duration: 1000,
		easing: Easing.inOut(Easing.ease),
		useNativeDriver: false,
	}), [size])

	const startAnimation = useCallback(() => {
		Animated.sequence([
			Animated.timing(animatedSize, animationConfig),
			Animated.timing(animatedSize, { ...animationConfig, toValue: size }),
		]).start(() => startAnimation())
	}, [animatedSize, animationConfig, size])

	useEffect(() => startAnimation(), [startAnimation])

	return (
		<Animated.View style={{ height: animatedSize, width: animatedSize }}>
			<View style={[styles.main, { borderColor: color }, styles.tl]} />
			<View style={[styles.main, { borderColor: color }, styles.tr]} />
			<View style={[styles.main, { borderColor: color }, styles.bl]} />
			<View style={[styles.main, { borderColor: color }, styles.br]} />
		</Animated.View>
	)
}

const pos = 0
const markerWidth = 8
const radius = 30
const size = 50

const styles = StyleSheet.create({
	main: {
		position: 'absolute',
		height: size,
		width: size,
	},
	tl: {
		top: pos,
		left: pos,
		borderTopWidth: markerWidth,
		borderLeftWidth: markerWidth,
		borderTopLeftRadius: radius,
	},
	tr: {
		top: pos,
		right: pos,
		borderTopWidth: markerWidth,
		borderRightWidth: markerWidth,
		borderTopRightRadius: radius,
	},
	bl: {
		bottom: pos,
		left: pos,
		borderBottomWidth: markerWidth,
		borderLeftWidth: markerWidth,
		borderBottomLeftRadius: radius,
	},
	br: {
		bottom: pos,
		right: pos,
		borderBottomWidth: markerWidth,
		borderRightWidth: markerWidth,
		borderBottomRightRadius: radius,
	},
})
