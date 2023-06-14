import { StyleSheet, View } from 'react-native'

export default function QRMarker({ size }: { size: number }) {
	return (
		<View style={{ height: size, width: size }}>
			<View style={[styles.main, styles.tl]} />
			<View style={[styles.main, styles.tr]} />
			<View style={[styles.main, styles.bl]} />
			<View style={[styles.main, styles.br]} />
		</View>
	)
}

const markerWidth = 5

const styles = StyleSheet.create({
	main: {
		position: 'absolute',
		height: 50,
		width: 50,
		borderColor: '#FFF',
	},
	tl: {
		top: 0,
		left: 0,
		borderTopWidth: markerWidth,
		borderLeftWidth: markerWidth,
	},
	tr: {
		top: 0,
		right: 0,
		borderTopWidth: markerWidth,
		borderRightWidth: markerWidth,
	},
	bl: {
		bottom: 0,
		left: 0,
		borderBottomWidth: markerWidth,
		borderLeftWidth: markerWidth,
	},
	br: {
		bottom: 0,
		right: 0,
		borderBottomWidth: markerWidth,
		borderRightWidth: markerWidth,
	},
})
