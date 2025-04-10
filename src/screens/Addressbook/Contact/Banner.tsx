import { l } from '@log'
import { HexKey } from '@model/nostr'
import { imgProxy } from '@nostr/consts'
import { isStr } from '@util'
import { Image } from 'expo-image'
import { useState } from 'react'
import { Dimensions, View } from 'react-native'
import { ScaledSheet, vs } from 'react-native-size-matters'

import { headers } from '../const'

interface IProfileBannerProps {
	hex?: HexKey
	uri?: string
	dimmed?: boolean
	isSending?: boolean
}

export default function ProfileBanner({ hex, uri, dimmed, isSending }: IProfileBannerProps) {

	const [isErr, setIsErr] = useState(false)
	const getUri = (uri: string) => `${imgProxy(hex ?? '', uri, Dimensions.get('window').width, 'banner', 600)}`

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
						style={[styles.banner, { height: isSending ? vs(140) : vs(180) }]}
					/>
					<View style={[styles.overlay, { backgroundColor: dimmed ? 'rgba(0, 0, 0, .5)' : 'transparent' }]} />
				</>
				:
				<Image
					 
					source={require('@assets/mixed_forest.png')}
					contentFit='cover'
					style={styles.defaultBanner}
				/>
			}
		</View>
	)
}

const styles = ScaledSheet.create({
	imgWrap: {
		width: '100%',
		justifyContent: 'center',
		overflow: 'hidden',
	},
	banner: {
		width: '100%',
		opacity: 1,
	},
	defaultBanner: {
		width: undefined,
		height: '320@vs',
		opacity: .4,
		marginTop: '-140@vs',
	},
	overlay: {
		position: 'absolute',
		width: '100%',
		height: '140@vs',
		zIndex: 1
	},
})