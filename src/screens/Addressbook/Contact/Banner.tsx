import { Image, View } from 'react-native'

export default function ProfileBanner({ uri, isUser }: { uri?: string, isUser?: boolean }) {
	const showBanner = uri?.length && isUser
	return (
		<View style={{ width: '100%', maxHeight: 200, justifyContent: 'center', overflow: 'hidden' }}>
			<Image
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				source={showBanner ? { uri } : require('@assets/mixed_forest.png')}
				style={{
					width: showBanner ? '100%' : undefined,
					height: 350,
					resizeMode: showBanner ? 'cover' : 'contain',
					opacity: showBanner ? 1 : .4,
					marginTop: showBanner ? 0 : -150
				}}
			/>
		</View>
	)
}