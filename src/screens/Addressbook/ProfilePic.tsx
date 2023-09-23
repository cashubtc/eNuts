import { PlusIcon, UserIcon } from '@comps/Icons'
import { useThemeContext } from '@src/context/Theme'
import { l } from '@src/logger'
import { imgProxy } from '@src/nostr/consts'
import { isStr } from '@src/util'
import { highlight as hi } from '@styles'
import { useEffect, useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'

interface IProfilePicProps {
	uri?: string
	size?: number
	isUser?: boolean
	withPlusIcon?: boolean
}

export default function ProfilePic({ uri, size, isUser, withPlusIcon }: IProfilePicProps) {
	const { color, highlight } = useThemeContext()
	const [isErr, setIsErr] = useState(false)
	const defaultSize = isUser ? 60 : 40
	const circleStyle = {
		width: size || defaultSize,
		height: size || defaultSize,
		borderRadius: size ? size / 2 : defaultSize / 2
	}
	useEffect(() => {
		if (!isStr(uri) || !uri?.length) { return }
		void Image.prefetch(`${imgProxy(uri, circleStyle?.width ?? 40)}`)
			.catch(e => l('img preload', uri, e))
	}, [circleStyle?.width, uri])
	return (
		<>
			{isStr(uri) && uri?.length && !isErr ?
				<Image
					defaultSource={{ uri: '../../../assets/user_icon.svg'}}
					onError={(err => {
						l({ uri, err })
						setIsErr(true)
					})}
					style={[
						styles.circle,
						styles.img,
						circleStyle
					]}
					source={{ uri: `${imgProxy(uri, circleStyle?.width ?? 40)}` }}
				/>
				:
				<View style={[
					styles.circle,
					{ borderColor: color.BORDER, backgroundColor: color.INPUT_BG, ...circleStyle }
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
		marginVertical: 5,
		marginRight: 20,
		zIndex: 2,
	},
	img: {
		resizeMode: 'contain',
		borderWidth: 0,
	}
})