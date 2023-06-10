import { HamburgerIcon, QRIcon } from '@comps/Icons'
import type { TBottomNavProps } from '@model/nav'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface TTopNavProps {
	withBackBtn?: boolean
	backHandler?: () => void
	nav?: TBottomNavProps
}

export default function TopNav({ withBackBtn, backHandler, nav }: TTopNavProps) {
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
			<TouchableOpacity
				style={styles.topIconL}
				onPress={() => {
					navHook.dispatch(DrawerActions.openDrawer())
				}}
			>
				<HamburgerIcon color={color.TEXT} />
			</TouchableOpacity>
			<TouchableOpacity style={styles.topIconR} onPress={handlePress}>
				{withBackBtn ?
					<Text style={globals(color, highlight).pressTxt}>
						Back
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
		top: 75,
		left: 20,
		right: 20,
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	topIconL: {
		paddingRight: 20,
		paddingBottom: 20
	},
	topIconR: {
		paddingLeft: 20,
		paddingBottom: 20
	},
})