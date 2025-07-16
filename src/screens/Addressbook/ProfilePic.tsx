import { ListFavIcon, UserIcon } from '@comps/Icons'
import { l } from '@log'
import { imgProxy } from '@nostr/consts'
import { useThemeContext } from '@src/context/Theme'
import { highlight as hi, mainColors } from '@styles'
import { isStr } from '@util'
import { Image } from 'expo-image'
import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

import { headers } from './const'

interface INostrImg {
	hex?: string
	kind?: 'picture' | 'banner'
	width?: 64 | 192 | 600 | 1200
}

interface IProfilePicProps {
	uri?: string
	size?: number
	isUser?: boolean
	overlayColor?: string
	isFav?: boolean
	isInContacts?: boolean
}

export default function ProfilePic({
	hex,
	uri,
	size,
	isUser,
	overlayColor,
	isFav,
	isInContacts,
}: IProfilePicProps & INostrImg) {

	const { color, highlight } = useThemeContext()
	const [isErr, setIsErr] = useState(false)
	const defaultSize = useMemo(() => isUser ? s(60) : s(40), [isUser])
	const circleStyle = {
		width: size || defaultSize,
		height: size || defaultSize,
		borderRadius: size ? size / 2 : defaultSize / 2
	}
	const proxyUri = useMemo(() => `${imgProxy(hex ?? '', uri ?? '', circleStyle.width, 'picture', 64)}`, [circleStyle.width, hex, uri])

	return (
		<View style={{ position: 'relative', marginRight: isUser ? 0 : s(10) }}>
			{isStr(proxyUri) && proxyUri.length > 0 && !isErr ?
				<Image
					// https://docs.expo.dev/versions/latest/sdk/image/
					// https://docs.expo.dev/versions/latest/sdk/image/#recyclingkey
					source={{ uri: proxyUri, headers }}
					onError={(e => {
						l('img err for url: ', uri, e, proxyUri)
						setIsErr(true)
					})}
					cachePolicy='disk'
					recyclingKey={hex}
					transition={200}
					contentFit='cover'
					style={[
						styles.circle,
						styles.img,
						{ overlayColor },
						circleStyle
					]}
				/>
				:
				<View style={[
					styles.circle,
					{
						borderColor: color.BORDER,
						backgroundColor: color.INPUT_BG,
						...circleStyle
					}
				]}>
					<UserIcon width={isUser ? s(15) : s(30)} height={isUser ? vs(15) : vs(30)} color={hi[highlight]} />
				</View>
			}
			{!isUser && isInContacts &&
				<View style={[styles.imgIcon, styles.isContact, styles.right, { backgroundColor: hi[highlight],  }]}>
					<UserIcon width={s(10)} height={vs(10)} color={mainColors.WHITE} />
				</View>
			}
			{!isUser && isFav &&
				<View style={[styles.imgIcon, styles.left]}>
					<ListFavIcon width={s(14)} height={vs(14)} color={mainColors.STAR} />
				</View>
			}
		</View>
	)
}

const styles = ScaledSheet.create({
	circle: {
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 2,
	},
	img: {
		borderWidth: 0,
	},
	imgIcon: {
		position: 'absolute',
		bottom: 0,
		zIndex: 2,
	},
	right: {
		right: 0,
	},
	left: {
		left: 0,
	},
	isContact: {
		width: '14@s',
		height: '14@vs',
		borderRadius: 7,
		justifyContent: 'center',
		alignItems: 'center',
	}
})