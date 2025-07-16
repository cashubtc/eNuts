import { BookIconNav, SettingsIcon, WalletIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TBottomNavProps, TRouteString } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { highlight as hi } from '@styles'
import { isStr } from '@util'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function BottomNav({ navigation, route }: TBottomNavProps) {
	const { t } = useTranslation([NS.topNav])
	const { color, highlight } = useThemeContext()

	const handleNav = async (routeStr: TRouteString) => {
		// handle nostr explainer for addressbook
		if (routeStr === 'Address book') {
			// check if explainer has been viewed, else navigate to screen
			const nostrExplainer = await store.get(STORE_KEYS.nostrexplainer)
			navigation.navigate(!isStr(nostrExplainer) || !nostrExplainer.length ? 'nostr onboarding' : routeStr)
			return
		}
		navigation.navigate(routeStr)
	}

	const isWalletRelatedScreen = route.name === 'dashboard'

	const isSettingsRelatedScreen = route.name === 'Settings' || route.name === 'Display settings'

	return (
		<View
			style={[
				styles.bottomNav,
				{
					paddingBottom: isIOS ? s(25) : s(5),
					backgroundColor: color.BACKGROUND,
				},
			]}>
			<TouchableOpacity
				style={styles.navIcon}
				onPress={() => void handleNav('dashboard')}
				disabled={isWalletRelatedScreen}
			>
				<WalletIcon
					width={s(23)}
					height={s(23)}
					color={isWalletRelatedScreen ? hi[highlight] : color.TEXT}
					active={isWalletRelatedScreen}
				/>
				<Txt
					txt={t('wallet', { ns: NS.bottomNav })}
					styles={[styles.iconTxt, {
						color: isWalletRelatedScreen ? hi[highlight] : color.TEXT,
						fontWeight: isWalletRelatedScreen ? '500' : '400'
					}]}
				/>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.navIcon}
				onPress={() => void handleNav('Address book')}
				disabled={route.name === 'Address book'}
			>
				<BookIconNav
					width={s(22)}
					height={s(22)}
					color={route.name === 'Address book' ? hi[highlight] : color.TEXT}
					active={route.name === 'Address book'}
				/>
				<Txt
					txt={t('contacts', { ns: NS.bottomNav })}
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
				onPress={() => void handleNav('Settings')}
				disabled={isSettingsRelatedScreen}
			>
				<SettingsIcon
					width={s(22)}
					height={s(22)}
					color={isSettingsRelatedScreen ? hi[highlight] : color.TEXT}
					active={isSettingsRelatedScreen}
				/>
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

const styles = ScaledSheet.create({
	bottomNav: {
		position: 'absolute',
		left: 0,
		bottom: 0,
		right: 0,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-around',
		paddingTop: '5@s',
	},
	navIcon: {
		minWidth: '100@s',
		alignItems: 'center',
		// marginTop: '10@s',
	},
	iconTxt: {
		fontSize: '10@s',
		marginTop: '3@s',
	}
})