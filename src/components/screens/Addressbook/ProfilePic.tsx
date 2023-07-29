import { PlusIcon, UserIcon } from '@comps/Icons'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { useContext } from 'react'
import { Image, StyleSheet, View } from 'react-native'

interface IProfilePicProps {
	uri?: string
	size?: number
	isUser?: boolean
	withPlusIcon?: boolean
}

export default function ProfilePic({ uri, size, isUser, withPlusIcon }: IProfilePicProps) {
	const { color, highlight } = useContext(ThemeContext)

	return (
		<>
			{uri?.length && isUser ?
				<Image
					style={[
						styles.circle,
						styles.img,
						{ width: size || 60, height: size || 60, borderRadius: size ? size / 2 : 30 }
					]}
					source={{ uri }}
				/>
				:
				<View style={[
					styles.circle,
					{ borderColor: color.BORDER, backgroundColor: color.INPUT_BG }
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