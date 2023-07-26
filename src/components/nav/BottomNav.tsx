import { BookIcon, MintBoardIcon, SettingsIcon, WalletIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import type { TBottomNavProps, TRouteString } from '@model/nav'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function BottomNav({ navigation, route }: TBottomNavProps) {
	const { t } = useTranslation(['topNav'])
	const { color, highlight } = useContext(ThemeContext)
	const insets = useSafeAreaInsets()

	const handleNav = (routeStr: TRouteString) => navigation.navigate(routeStr)

	const isMintRelatedScreen =
		route.name === 'mints' ||
		route.name === 'mintmanagement' ||
		route.name === 'mint proofs'

	const isWalletRelatedScreen = route.name === 'dashboard'

	const isSettingsRelatedScreen = route.name === 'Settings' ||
		route.name === 'Display settings' ||
		route.name === 'Security settings' ||
		route.name === 'BackupPage'

	return (
		<View style={[styles.bottomNav, { backgroundColor: color.BACKGROUND, paddingBottom: insets.bottom }]}>
			<TouchableOpacity
				style={styles.navIcon}
				onPress={() => handleNav('dashboard')}
			>
				<WalletIcon color={isWalletRelatedScreen ? hi[highlight] : color.TEXT} />
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
				onPress={() => handleNav('mints')}
			>
				<MintBoardIcon color={isMintRelatedScreen ? hi[highlight] : color.TEXT} />
				<Txt
					txt='Mints'
					styles={[styles.iconTxt, {
						color: isMintRelatedScreen ? hi[highlight] : color.TEXT,
						fontWeight: isMintRelatedScreen ? '500' : '400'
					}]}
				/>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.navIcon}
				onPress={() => handleNav('Address book')}
			>
				<BookIcon color={route.name === 'Address book' ? hi[highlight] : color.TEXT} />
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
				<SettingsIcon color={isSettingsRelatedScreen ? hi[highlight] : color.TEXT} />
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
		bottom: 0,
		left: 0,
		right: 0,
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-around',
	},
	navIcon: {
		minWidth: 70,
		minHeight: 50,
		alignItems: 'center',
		marginTop: 10,
	},
	iconTxt: {
		fontSize: 12,
		marginTop: 2,
	}
})