import { ScanQRIcon } from '@comps/Icons'
import { useThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface TTopNavProps {
	screenName?: string
	withBackBtn?: boolean
	cancel?: boolean
	handlePress?: () => void
}

export default function TopNav({ screenName, withBackBtn, cancel, handlePress }: TTopNavProps) {
	const { t } = useTranslation(['common'])
	const { color, highlight } = useThemeContext()
	return (
		<View style={[styles.topNav, { backgroundColor: color.BACKGROUND }]}>
			{screenName ?
				<Text style={globals(color).navTxt}>
					{screenName}
				</Text>
				:
				<View />
			}
			<TouchableOpacity style={styles.topIconR} onPress={handlePress}>
				{(withBackBtn || cancel) ?
					<Text style={globals(color, highlight).pressTxt}>
						{t(withBackBtn ? 'back' : 'cancel')}
					</Text>
					:
					<ScanQRIcon color={color.TEXT} />
				}
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	topNav: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: 60,
		paddingHorizontal: 20,
		paddingBottom: 10,
		zIndex: 10
	},
	topIconR: {
		paddingLeft: 20,
	},
})