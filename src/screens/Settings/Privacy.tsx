import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TPrivacySettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { usePrivacyContext } from '@src/context/Privacy'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { globals, highlight as hi } from '@styles'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Switch, Text, View } from 'react-native'

export default function PrivacySettings({ navigation, route }: TPrivacySettingsPageProps) {
	const { t } = useTranslation([NS.topNav])
	const { color, highlight } = useThemeContext()
	const { hidden, setHidden } = usePrivacyContext()

	const handleHiddenBalance = async () => {
		setHidden({ balance: !hidden.balance, txs: hidden.txs })
		if (hidden.balance) {
			await store.delete(STORE_KEYS.hiddenBal)
			return
		}
		await store.set(STORE_KEYS.hiddenBal, '1')
	}

	const handleHiddenTxs = async () => {
		setHidden({ balance: hidden.balance, txs: !hidden.txs })
		if (hidden.txs) {
			await store.delete(STORE_KEYS.hiddenTxs)
			return
		}
		await store.set(STORE_KEYS.hiddenTxs, '1')
	}

	return (
		<Screen
			screenName={t('privacy')}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<Text style={[styles.subHeader, { color: color.TEXT }]}>
				{t('general')}
			</Text>
			<View style={[globals(color).wrapContainer, { paddingVertical: 10 }]}>
				<View style={styles.wrap}>
					<Txt txt={t('hideNuts', { ns: NS.common })} />
					<Switch
						trackColor={{ false: color.BORDER, true: hi[highlight] }}
						thumbColor={color.TEXT}
						onValueChange={handleHiddenBalance}
						value={hidden.balance}
					/>
				</View>
				<Separator style={[{ marginVertical: isIOS ? 18 : 10 }]} />
				<View style={styles.wrap}>
					<Txt txt={t('hideLatestTxs', { ns: NS.common })} />
					<Switch
						trackColor={{ false: color.BORDER, true: hi[highlight] }}
						thumbColor={color.TEXT}
						onValueChange={handleHiddenTxs}
						value={hidden.txs}
					/>
				</View>
			</View>
			<BottomNav navigation={navigation} route={route} />
		</Screen >
	)
}

const styles = StyleSheet.create({
	subHeader: {
		fontSize: 16,
		fontWeight: '500',
		paddingHorizontal: 20,
		marginBottom: 10,
	},
	wrap: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
})