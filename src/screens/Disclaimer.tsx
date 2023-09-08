import { ChevronRightIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { TDisclaimerPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { isIOS } from '@src/consts'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

export function Disclaimer({ navigation }: TDisclaimerPageProps) {
	const { color } = useThemeContext()
	const { t } = useTranslation([NS.wallet])
	return (
		<View style={{ flex: 1, backgroundColor: color.BACKGROUND }}>
			<TopNav
				screenName={t('disclaimer', { ns: NS.common })}
				withBackBtn
				handlePress={() => navigation.goBack()}
			/>
			<ScrollView style={styles.container}>
				<Txt
					txt={t('disclaimerHint', { ns: NS.common })}
					styles={[styles.subheader]}
				/>
				<View style={[globals(color).wrapContainer, { paddingVertical: 20 }]}>
					<TouchableOpacity
						onPress={() => navigation.navigate('About settings')}
						style={styles.shareFeedback}
					>
						<Txt txt={t('shareOrReport', { ns: NS.common })} styles={[{ fontSize: 18, fontWeight: '500' }]} />
						<ChevronRightIcon color={color.TEXT} />
					</TouchableOpacity>
					<Separator style={[styles.separator]} />
					{/* beta */}
					<Txt txt={t('enutsDisclaimer')} styles={[styles.header, { color: color.TEXT }]} />
					<Txt txt={t('disclaimer')} />
					<Separator style={[styles.separator]} />
					{/* enuts mint */}
					<Txt txt={t('enutsMint')} styles={[styles.header, { color: color.TEXT }]} />
					<Txt txt={t('mintDisclaimer')} />
					<Separator style={[styles.separator]} />
					{/* custodial */}
					<Txt txt={t('custodialRisk')} styles={[styles.header, { color: color.TEXT }]} />
					<Txt txt={t('custodialRiskContent')} />
					<Separator style={[styles.separator]} />
					{/* loss */}
					<Txt txt={t('lossOfTokens')} styles={[styles.header, { color: color.TEXT }]} />
					<Txt txt={t('lossContent')} />
					<Separator style={[styles.separator]} />
					{/* cashu */}
					<Txt txt={t('cashuExperiment')} styles={[styles.header, { color: color.TEXT }]} />
					<Txt txt={t('cashuContent')} />
				</View>
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		marginTop: 110,
		marginBottom: isIOS ? 25 : 0,
	},
	header: {
		fontWeight: '500',
		fontSize: 18,
		marginBottom: 10,
	},
	subheader: {
		fontWeight: '500',
		paddingHorizontal: 20,
		marginBottom: 20,
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
	shareFeedback: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	}
})