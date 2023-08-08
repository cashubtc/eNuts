import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TPrivacySettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { PrivacyContext } from '@src/context/Privacy'
import { useThemeContext } from '@src/context/Theme'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { globals, highlight as hi } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Switch, Text, View } from 'react-native'

export default function PrivacySettings({ navigation, route }: TPrivacySettingsPageProps) {
	const { t } = useTranslation(['topNav'])
	const { color, highlight } = useThemeContext()
	const { hidden, setHidden } = useContext(PrivacyContext)
	const handleHidden = async () => {
		if (hidden) {
			setHidden(false)
			await store.delete(STORE_KEYS.hiddenBal)
			return
		}
		setHidden(true)
		await store.set(STORE_KEYS.hiddenBal, '1')
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
			<View style={[globals(color).wrapContainer, styles.wrap, { paddingVertical: isIOS ? 18 : 10 }]}>
				<Txt txt={t('hideNuts', { ns: 'common' })} />
				<Switch
					trackColor={{ false: color.BORDER, true: hi[highlight] }}
					thumbColor={color.TEXT}
					onValueChange={handleHidden}
					value={hidden}
				/>
			</View>
			<BottomNav navigation={navigation} route={route} />
		</Screen>
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
		marginBottom: 20,
	},
})