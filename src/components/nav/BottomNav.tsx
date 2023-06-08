import { HistoryIcon, MintBoardIcon, WalletIcon } from '@comps/Icons'
import type { TBottomNavProps, TRouteString } from '@model/nav'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import React, { useContext } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export default function BottomNav({ navigation, route }: TBottomNavProps) {
	const { color, highlight } = useContext(ThemeContext)

	const handleNav = (routeStr: TRouteString) => navigation.navigate(routeStr)

	const isMintRelatedPage =
		route.name === 'mints' ||
		route.name === 'mintmanagement' ||
		route.name === 'mint proofs' ||
		(route.name === 'lightning' && !route.params?.receive && !route.params?.send)

	return (
		<View style={styles.bottomNav}>
			<TouchableOpacity
				style={styles.navIcon}
				onPress={() => handleNav('dashboard')}
			>
				<WalletIcon
					color={route.name === 'dashboard' ||
						(route.name === 'lightning' && (route.params?.receive || route.params?.send))
						? hi[highlight] : color.TEXT
					}
				/>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.navIcon}
				onPress={() => handleNav('history')}
			>
				<HistoryIcon width={28} height={20} color={route.name === 'history' ? hi[highlight] : color.TEXT} />
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.navIcon}
				onPress={() => handleNav('mints')}
			>
				<MintBoardIcon
					color={isMintRelatedPage ?
						hi[highlight]
						:
						color.TEXT
					}
				/>
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	bottomNav: {
		position: 'absolute',
		bottom: 0,
		left: 60,
		right: 60,
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	navIcon: {
		paddingRight: 20,
		paddingBottom: 25,
		paddingLeft: 20,
	}
})