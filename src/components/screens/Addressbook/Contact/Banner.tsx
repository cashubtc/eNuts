import { Image, StyleSheet, View } from 'react-native'

export default function ProfileBanner({ uri }: { uri?: string }) {
	return (
		<View style={{ width: '100%', maxHeight: 200, justifyContent: 'center', overflow: 'hidden' }}>
			<Image
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				source={uri?.length ? { uri } : require('@assets/mixed_forest.png')}
				style={styles.banner}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	banner: {
		height: 250,
		resizeMode: 'cover',
	}
})

/*


<div className={styles.bannerWrap}>
			{src.length ?
				<img src={src} alt='banner' className={styles.banner} />
				:
				<Image
					src='/imgs/banner.jpg'
					width={1200}
					height={720}
					alt='banner'
					className={styles.banner}
				/>
			}
		</div>

*/