import { QRIcon } from '@comps/Icons'
import type { TBottomNavProps } from '@model/nav'
import { useNavigation } from '@react-navigation/native'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface TTopNavProps {
	screenName?: string
	withBackBtn?: boolean
	nav?: TBottomNavProps
	backHandler?: () => void
	cancel?: boolean
}

export default function TopNav({ screenName, withBackBtn, nav, backHandler, cancel }: TTopNavProps) {
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const navHook = useNavigation()
	const handlePress = () => {
		if (withBackBtn || cancel) {
			if (backHandler) {
				backHandler()
				return
			}
			navHook.goBack()
			return
		}
		// open QR Scan
		nav?.navigation.navigate('qr scan', { mint: undefined })
	}
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
				{withBackBtn ?
					<Text style={globals(color, highlight).pressTxt}>
						{t('back')}
					</Text>
					:
					cancel ?
						<Text style={globals(color, highlight).pressTxt}>
							{t('cancel')}
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