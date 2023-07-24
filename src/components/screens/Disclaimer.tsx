import Button from '@comps/Button'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { TDisclaimerPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'

export function Disclaimer({ navigation }: TDisclaimerPageProps) {
	const { color } = useContext(ThemeContext)
	const { t } = useTranslation(['wallet'])
	return (
		<View style={{ flex: 1, backgroundColor: color.BACKGROUND }}>
			<TopNav screenName={t('disclaimer', { ns: 'common' })} withBackBtn />
			<ScrollView style={styles.container}>
				<View style={[globals(color).wrapContainer, { paddingVertical: 20 }]}>
					{/* beta */}
					<Txt txt={t('enutsDisclaimer')} styles={[styles.header]} />
					<Txt txt={t('disclaimer')} />
					<Separator style={[styles.separator]} />
					{/* custodial */}
					<Txt txt={t('custodialRisk')} styles={[styles.header]} />
					<Txt txt={t('custodialRiskContent')} />
					<Separator style={[styles.separator]} />
					{/* loss */}
					<Txt txt={t('lossOfTokens')} styles={[styles.header]} />
					<Txt txt={t('lossContent')} />
					<Separator style={[styles.separator]} />
					{/* cashu */}
					<Txt txt={t('cashuExperiment')} styles={[styles.header]} />
					<Txt txt={t('cashuContent')} />
				</View>
			</ScrollView>
			<View style={styles.ok}>
				<Button
					txt='OK'
					onPress={() => navigation.navigate('dashboard')}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		marginTop: 100,
		marginBottom: 110,
	},
	header: {
		fontWeight: '500',
		fontSize: 18,
		marginBottom: 10
	},
	separator: {
		marginVertical: 20
	},
	ok: {
		position: 'absolute',
		bottom: 20,
		right: 20,
		left: 20,
	},
})