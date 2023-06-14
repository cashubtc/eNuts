import { ContactsIcon, HistoryIcon, MintBoardIcon, SettingsIcon, WalletIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import type { TBottomNavProps, TRouteString } from '@model/nav'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { useContext } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export default function BottomNav({ navigation, route }: TBottomNavProps) {
	const { color, highlight } = useContext(ThemeContext)

	const handleNav = (routeStr: TRouteString) => navigation.navigate(routeStr)

	const isMintRelatedPage =
		route.name === 'mints' ||
		route.name === 'mintmanagement' ||
		route.name === 'mint proofs' ||
		(route.name === 'lightning' && !route.params?.receive && !route.params?.send)

	const isWalletRelatedScreen = route.name === 'dashboard' ||
		(route.name === 'lightning' && (route.params?.receive || route.params?.send))

	const isSettingsRelatedPage = route.name === 'Settings' ||
		route.name === 'Display settings' ||
		route.name === 'Security settings' ||
		route.name === 'BackupPage'

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
				<HistoryIcon color={route.name === 'history' ? hi[highlight] : color.TEXT} />
				<Txt
					txt='History'
					styles={[{ fontSize: 12, color: route.name === 'history' ? hi[highlight] : color.TEXT }]}
				/>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.navIcon}
				onPress={() => handleNav('mints')}
			>
				<MintBoardIcon
					width={20}
					height={25}
					color={isMintRelatedPage ? hi[highlight] : color.TEXT}
				/>
				<Txt
					txt='Mints'
					styles={[{ fontSize: 12, marginTop: 1, color: isMintRelatedPage ? hi[highlight] : color.TEXT }]}
				/>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.navIcon}
				onPress={() => handleNav('Address book')}
			>
				<ContactsIcon color={route.name === 'Address book' ? hi[highlight] : color.TEXT} />
				<Txt
					txt='Contacts'
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
				<SettingsIcon color={isSettingsRelatedPage ? hi[highlight] : color.TEXT} />
				<Txt
					txt='Settings'
					styles={[{ fontSize: 12, color: isSettingsRelatedPage ? hi[highlight] : color.TEXT }]}
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