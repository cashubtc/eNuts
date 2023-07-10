import { ContactsIcon, HistoryIcon, MintBoardIcon, SettingsIcon, WalletIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
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

	const isMintRelatedScreen =
		route.name === 'mints' ||
		route.name === 'mintmanagement' ||
		route.name === 'mint proofs' ||
		(route.name === 'lightning' && !route.params?.receive && !route.params?.send)

	const isWalletRelatedScreen = route.name === 'dashboard' ||
		(route.name === 'lightning' && (route.params?.receive || route.params?.send))

	const isSettingsRelatedScreen = route.name === 'Settings' ||
		route.name === 'Display settings' ||
		route.name === 'Security settings' ||
		route.name === 'BackupPage'

	const isHistoryRelatedScreen = route.name === 'history' || route.name === 'history entry details'

	return (
		<View style={styles.bottomNav}>
			<TouchableOpacity
				style={styles.navIcon}
				onPress={() => handleNav('dashboard')}
			>
				<WalletIcon color={isWalletRelatedScreen ? hi[highlight] : color.TEXT} />
				<Txt
					txt='Wallet'
					styles={[{ fontSize: 12, marginTop: 2, color: isWalletRelatedScreen ? hi[highlight] : color.TEXT }]}
				/>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.navIcon}
				onPress={() => handleNav('history')}
			>
				<HistoryIcon color={isHistoryRelatedScreen ? hi[highlight] : color.TEXT} />
				<Txt
					txt={t('history')}
					styles={[{ fontSize: 12, color: isHistoryRelatedScreen ? hi[highlight] : color.TEXT }]}
				/>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.navIcon}
				onPress={() => handleNav('mints')}
			>
				<MintBoardIcon
					width={20}
					height={25}
					color={isMintRelatedScreen ? hi[highlight] : color.TEXT}
				/>
				<Txt
					txt='Mints'
					styles={[{ fontSize: 12, marginTop: 1, color: isMintRelatedScreen ? hi[highlight] : color.TEXT }]}
				/>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.navIcon}
				onPress={() => handleNav('Address book')}
			>
				<ContactsIcon color={route.name === 'Address book' ? hi[highlight] : color.TEXT} />
				<Txt
					txt={t('contacts', { ns: 'bottomNav' })}
					styles={[{
						fontSize: 12,
						marginTop: -2,
						color: route.name === 'Address book' ? hi[highlight] : color.TEXT
					}]}
				/>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.navIcon}
				onPress={() => handleNav('Settings')}
			>
				<SettingsIcon color={isSettingsRelatedScreen ? hi[highlight] : color.TEXT} />
				<Txt
					txt={t('settings')}
					styles={[{ fontSize: 12, marginTop: 1, color: isSettingsRelatedScreen ? hi[highlight] : color.TEXT }]}
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
		flex: 1,
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-around',
	},
	navIcon: {
		minWidth: 70,
		minHeight: 50,
		alignItems: 'center',
	}
})