import { QRIcon } from '@comps/Icons'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
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
	const { color, highlight } = useContext(ThemeContext)
	return (
		<View style={styles.topNav}>
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
					<QRIcon color={color.TEXT} />
				}
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	topNav: {
		position: 'absolute',
		top: 40,
		left: 20,
		right: 20,
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	topIconR: {
		paddingLeft: 20,
		paddingVertical: 20
	},
})