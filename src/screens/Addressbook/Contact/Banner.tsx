import { l } from '@log'
import { HexKey } from '@model/nostr'
import { imgProxy } from '@nostr/consts'
import { isStr } from '@util'
import { Image } from 'expo-image'
import { useState } from 'react'
import { Dimensions, StyleSheet, View } from 'react-native'

import { headers } from '../const'

export default function ProfileBanner({ hex, uri, dimmed }: { hex: HexKey, uri?: string, dimmed?: boolean }) {

	const [isErr, setIsErr] = useState(false)
	const getUri = (uri: string) => `${imgProxy(hex, uri, Dimensions.get('window').width, 'banner', 600)}`

	return (
		<View style={styles.imgWrap}>
			{isStr(uri) && uri?.length > 0 && !isErr ?
				<>
					<Image
						source={{ uri: getUri(uri), headers }}
						onError={(e => {
							l('img err for url: ', uri, e, getUri(uri))
							setIsErr(true)
						})}
						cachePolicy='disk'
						transition={200}
						contentFit='cover'
						style={styles.banner}
					/>
					<View style={[styles.overlay, { backgroundColor: dimmed ? 'rgba(0, 0, 0, .5)' : 'transparent' }]} />
				</>
				:
				<Image
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					source={require('@assets/mixed_forest.png')}
					contentFit='cover'
					style={styles.defaultBanner}
				/>
			}
		</View>
	)
}

const styles = StyleSheet.create({
	imgWrap: {
		width: '100%',
		justifyContent: 'center',
		overflow: 'hidden',
	},
	banner: {
		width: '100%',
		height: 200,
		opacity: 1,
	},
	defaultBanner: {
		width: undefined,
		height: 350,
		opacity: .4,
		marginTop: -150
	},
	overlay: {
		position: 'absolute',
		width: '100%',
		height: 200,
		zIndex: 1
	},
})