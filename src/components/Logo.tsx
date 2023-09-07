import { Image, type ImageStyle, type StyleProp, StyleSheet, View } from 'react-native'

interface ILogoProps {
	size: number
	success?: boolean
	style?: StyleProp<ImageStyle>
}

export default function Logo({ size, success, style }: ILogoProps) {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const src = success ? require('@assets/icon_transparent_success.png') : require('@assets/icon_transparent.png')
	return (
		<View style={styles.imgWrap}>
			<Image
				style={[styles.img, { height: size }, style]}
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				source={src}
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