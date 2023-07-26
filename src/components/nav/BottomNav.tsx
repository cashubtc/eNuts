import { BookIcon, SettingsIcon, WalletIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TBottomNavProps, TRouteString } from '@model/nav'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export default function BottomNav({ navigation, route }: TBottomNavProps) {
	const { t } = useTranslation(['topNav'])
	const { color, highlight } = useContext(ThemeContext)

	const handleNav = (routeStr: TRouteString) => navigation.navigate(routeStr)

	// const isMintRelatedScreen =
	// 	route.name === 'mints' ||
	// 	route.name === 'mintmanagement' ||
	// 	route.name === 'mint proofs'

	const isWalletRelatedScreen = route.name === 'dashboard'

	const isSettingsRelatedScreen = route.name === 'Settings' ||
		route.name === 'Display settings' ||
		route.name === 'Security settings' ||
		route.name === 'BackupPage'

	return (
		<View style={[styles.bottomNav, { backgroundColor: color.BACKGROUND, paddingBottom: isIOS ? 40 : 10 }]}>
			<TouchableOpacity
				style={styles.navIcon}
				onPress={() => handleNav('dashboard')}
			>
				<WalletIcon width={28} height={28} color={isWalletRelatedScreen ? hi[highlight] : color.TEXT} />
				<Txt
					txt='Wallet'
					styles={[styles.iconTxt, {
						color: isWalletRelatedScreen ? hi[highlight] : color.TEXT,
						fontWeight: isWalletRelatedScreen ? '500' : '400'
					}]}
				/>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.navIcon}
				onPress={() => handleNav('Address book')}
			>
				<BookIcon width={28} height={28} color={route.name === 'Address book' ? hi[highlight] : color.TEXT} />
				<Txt
					txt={t('contacts', { ns: 'bottomNav' })}
					styles={[
						styles.iconTxt, {
							color: route.name === 'Address book' ? hi[highlight] : color.TEXT,
							fontWeight: route.name === 'Address book' ? '500' : '400'
						}
					]}
				/>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.navIcon}
				onPress={() => handleNav('Settings')}
			>
				<SettingsIcon width={28} height={28} color={isSettingsRelatedScreen ? hi[highlight] : color.TEXT} />
				<Txt
					txt={t('settings')}
					styles={[styles.iconTxt, {
						color: isSettingsRelatedScreen ? hi[highlight] : color.TEXT,
						fontWeight: isSettingsRelatedScreen ? '500' : '400'
					}]}
				/>
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	bottomNav: {
		position: 'absolute',
		left: 0,
		bottom: 0,
		right: 0,
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-around',
	},
	navIcon: {
		minWidth: 100,
		alignItems: 'center',
		marginTop: 10,
	},
	iconTxt: {
		fontSize: 14,
		marginTop: 4,
	}
})