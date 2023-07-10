import { QRIcon } from '@comps/Icons'
import type { TBottomNavProps } from '@model/nav'
import { useNavigation } from '@react-navigation/native'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { getTranslationLangCode } from '@util/localization'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface TTopNavProps {
	screenName?: string
	withBackBtn?: boolean
	nav?: TBottomNavProps
	backHandler?: () => void
}

export default function TopNav({ screenName, withBackBtn, nav, backHandler }: TTopNavProps) {
	const { t } = useTranslation(getTranslationLangCode())
	const { color, highlight } = useContext(ThemeContext)
	const navHook = useNavigation()
	const handlePress = () => {
		if (withBackBtn) {
			if (backHandler) {
				backHandler()
				return
			}
			navHook.goBack()
			return
		}
		// open QR Scan
		nav?.navigation.navigate('qr scan')
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
						{t('common.back')}
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