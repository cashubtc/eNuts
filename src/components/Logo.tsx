import { Image, type ImageStyle, type StyleProp, StyleSheet, View } from 'react-native'

export default function Logo({ size, style }: { size: number, style?: StyleProp<ImageStyle> }) {
	return (
		<View style={styles.imgWrap}>
			<Image
				style={[styles.img, { height: size }, style]}
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				source={require('@assets/icon_transparent.png')}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	imgWrap: {
		alignItems: 'center',
	},
	img: {
		resizeMode: 'contain',
	},
	Img: {
		width: 200,
		height: 200,
		resizeMode: 'contain'
	},
})