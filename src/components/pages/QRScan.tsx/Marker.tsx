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
		borderTopWidth: 10,
		borderLeftWidth: 10,
	},
	tr: {
		top: 0,
		right: 0,
		borderTopWidth: 10,
		borderRightWidth: 10,
	},
	bl: {
		bottom: 0,
		left: 0,
		borderBottomWidth: 10,
		borderLeftWidth: 10,
	},
	br: {
		bottom: 0,
		right: 0,
		borderBottomWidth: 10,
		borderRightWidth: 10,
	},
})
