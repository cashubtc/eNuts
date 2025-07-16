import { useThemeContext } from '@src/context/Theme'
import { Image, type ImageStyle, type StyleProp, StyleSheet, View } from 'react-native'

interface ILogoProps {
	size: number
	success?: boolean
	style?: StyleProp<ImageStyle>
}

export default function Logo({ size, success, style }: ILogoProps) {
	const { highlight, theme } = useThemeContext()
	 
	const src = success ?
		require('@assets/icon_transparent_success.png')
		:
		theme === 'Dark' && (highlight === 'Zap' || highlight === 'Azyre' || highlight === 'Rosy') ?
			require('@assets/icon_transparent_dark.png')
			:
			require('@assets/icon_transparent.png')
	return (
		<View style={styles.imgWrap}>
			<Image
				style={[styles.img, { height: size }, style]}
				 
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
})