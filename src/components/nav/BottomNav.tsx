import { BookIcon, SettingsIcon, WalletIcon } from '@comps/Icons'
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
import { SafeAreaView, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

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

	const isSettingsRelatedScreen = route.name === 'Settings' ||
		route.name === 'General settings' ||
		route.name === 'Display settings' ||
		route.name === 'Security settings' ||
		route.name === 'Privacy settings' ||
		route.name === 'Contacts settings'

	return (
		<SafeAreaView>
			<View
				style={[
					styles.bottomNav,
					{ paddingBottom: isIOS ? vs(25) : vs(10) },
				]}>
				<TouchableOpacity
					style={styles.navIcon}
					onPress={() => void handleNav('dashboard')}
					disabled={isWalletRelatedScreen}
				>
					<WalletIcon width={s(26)} height={s(26)} color={isWalletRelatedScreen ? hi[highlight] : color.TEXT} />
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
					<BookIcon width={s(26)} height={s(26)} color={route.name === 'Address book' ? hi[highlight] : color.TEXT} />
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
					<SettingsIcon width={s(26)} height={s(26)} color={isSettingsRelatedScreen ? hi[highlight] : color.TEXT} />
					<Txt
						txt={t('settings')}
						styles={[styles.iconTxt, {
							color: isSettingsRelatedScreen ? hi[highlight] : color.TEXT,
							fontWeight: isSettingsRelatedScreen ? '500' : '400'
						}]}
					/>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	)
}

const styles = ScaledSheet.create({
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
		minWidth: '100@s',
		alignItems: 'center',
		marginTop: '10@vs',
	},
	iconTxt: {
		fontSize: '12@vs',
		marginTop: '2@vs',
	}
})