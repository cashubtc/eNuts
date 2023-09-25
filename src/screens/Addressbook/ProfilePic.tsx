import { PlusIcon, UserIcon } from '@comps/Icons'
import { useThemeContext } from '@src/context/Theme'
// import { l } from '@src/logger'
import { isStr } from '@src/util'
import { highlight as hi } from '@styles'
import { Image } from 'expo-image'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

export type TNostrImg = INostrImgBanner & INostrImgPicture & { url: string }
interface INostrImgBanner {
	hex?: string
	kind?: 'banner'
	width?: 600 | 1200
}
interface INostrImgPicture {
	hex?: string
	kind?: 'picture'
	width?: 64 | 192
}
interface IProfilePicProps {
	uri?: string
	size?: number
	isUser?: boolean
	withPlusIcon?: boolean
	overlayColor?: string
}

export default function ProfilePic({ uri, size, isUser, withPlusIcon, overlayColor }: IProfilePicProps) {
	const { color, highlight } = useThemeContext()
	const [isErr, setIsErr] = useState(false)
	const defaultSize = isUser ? 60 : 40
	const circleStyle = {
		width: size || defaultSize,
		height: size || defaultSize,
		borderRadius: size ? size / 2 : defaultSize / 2
	}

	return (
		<>
			{isStr(uri) && uri?.length && !isErr ?
				<Image
					// https://docs.expo.dev/versions/latest/sdk/image/
					onError={(_e => {
						// l({ uri, err })
						setIsErr(true)
					})}
					// TODO FIXME
					// source={`${imgProxy(uri, circleStyle?.width ?? 40)}`}
					cachePolicy='memory-disk'
					transition={200}
					style={[
						styles.circle,
						styles.img,
						{ overlayColor, marginRight: isUser ? 0 : 10 },
						circleStyle
					]}
				/>
				:
				<View style={[
					styles.circle,
					{
						borderColor: color.BORDER,
						backgroundColor: color.INPUT_BG,
						marginRight: 10,
						...circleStyle
					}
				]}>
					{withPlusIcon ?
						<PlusIcon color={hi[highlight]} />
						:
						<UserIcon width={30} height={30} color={hi[highlight]} />
					}
				</View>
			}
		</>
	)
}

const styles = StyleSheet.create({
	circle: {
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 2,
	},
	img: {
		resizeMode: 'contain',
		borderWidth: 0,
	}
})