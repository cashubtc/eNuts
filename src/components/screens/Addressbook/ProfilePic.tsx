import { PlusIcon, UserIcon } from '@comps/Icons'
import { useThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { Image, StyleSheet, View } from 'react-native'

interface IProfilePicProps {
	uri?: string
	size?: number
	isUser?: boolean
	withPlusIcon?: boolean
}

export default function ProfilePic({ uri, size, isUser, withPlusIcon }: IProfilePicProps) {
	const { color, highlight } = useThemeContext()
	const defaultSize = isUser ? 60 : 40
	const circleStyle = {
		width: size || defaultSize,
		height: size || defaultSize,
		borderRadius: size ? size / 2 : defaultSize / 2 }

	return (
		<>
			{uri?.length && isUser ?
				<Image
					style={[
						styles.circle,
						styles.img,
						circleStyle
					]}
					source={{ uri }}
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