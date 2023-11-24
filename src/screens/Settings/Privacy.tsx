import { EyeClosedIcon, EyeIcon } from '@comps/Icons'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Toggle from '@comps/Toggle'
import Txt from '@comps/Txt'
import { appVersion } from '@consts/env'
import type { TPrivacySettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { usePrivacyContext } from '@src/context/Privacy'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { ScaledSheet, vs } from 'react-native-size-matters'

export default function PrivacySettings({ navigation, route }: TPrivacySettingsPageProps) {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const { hidden, handleHiddenBalance, handleHiddenTxs } = usePrivacyContext()

	return (
		<Screen
			screenName={t('privacy', { ns: NS.topNav })}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<ScrollView alwaysBounceVertical={false}>
				<View style={globals(color).wrapContainer}>
					<View style={[globals().wrapRow, { paddingBottom: vs(15) }]}>
						<View style={styles.iconWrap}>
							<Icon hidden={hidden.balance} />
							<Txt txt={t('hideNuts')} styles={[styles.optTxt]} />
						</View>
						<Toggle
							value={hidden.balance}
							onChange={() => void handleHiddenBalance()}
						/>
					</View>
					<Separator style={[styles.separator]} />
					<View style={[globals().wrapRow, { paddingBottom: vs(15) }]}>
						<View style={styles.iconWrap}>
							<Icon hidden={hidden.txs} />
							<Txt txt={t('hideLatestTxs')} styles={[styles.optTxt]} />
						</View>
						<Toggle
							value={hidden.txs}
							onChange={() => void handleHiddenTxs()}
						/>
					</View>
				</View>
				<Txt txt={appVersion} bold center />
			</ScrollView>
			<BottomNav navigation={navigation} route={route} />
		</Screen >
	)
}

function Icon({ hidden }: { hidden?: boolean }) {
	const { color } = useThemeContext()
	return hidden ? <EyeClosedIcon color={color.TEXT} /> : <EyeIcon color={color.TEXT} />
}

const styles = ScaledSheet.create({
	iconWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	optTxt: {
		marginLeft: '15@s'
	},
	separator: {
		marginBottom: '15@vs'
	}
})