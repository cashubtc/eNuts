import { Image, StyleSheet, View } from 'react-native'

export default function ProfileBanner({ uri, isUser }: { uri?: string, isUser?: boolean }) {
	const showBanner = uri?.length && isUser
	return (
		<View style={styles.imgWrap}>
			<Image
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				source={showBanner ? { uri } : require('@assets/mixed_forest.png')}
				style={{
					width: showBanner ? '100%' : undefined,
					height: showBanner ? 140 : 250,
					resizeMode: 'cover',
					opacity: showBanner ? 1 : .4,
					marginTop: showBanner ? 10 : -100
				}}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	imgWrap: {
		width: '100%',
		justifyContent: 'center',
		overflow: 'hidden',
	}
})