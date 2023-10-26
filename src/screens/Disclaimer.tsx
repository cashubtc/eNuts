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
					bold
					styles={[styles.subheader]}
				/>
				<View style={[globals(color).wrapContainer, { marginBottom: 20 }]}>
					<TouchableOpacity
						onPress={() => navigation.navigate('About settings')}
						style={styles.shareFeedback}
					>
						<Txt txt={t('shareOrReport', { ns: NS.common })} bold styles={[{ fontSize: 18 }]} />
						<ChevronRightIcon color={color.TEXT} />
					</TouchableOpacity>
				</View>
				<View style={{ marginHorizontal: 20 }}>
					{/* beta */}
					<Txt txt={t('enutsDisclaimer')} bold styles={[styles.header, { color: color.TEXT }]} />
					<Txt txt={t('disclaimer')} styles={[{ color: color.TEXT_SECONDARY }]} />
					<Separator style={[styles.separator]} />
					{/* enuts mint */}
					<Txt txt={t('enutsMint')} bold styles={[styles.header, { color: color.TEXT }]} />
					<Txt txt={t('mintDisclaimer')} styles={[{ color: color.TEXT_SECONDARY }]} />
					<Separator style={[styles.separator]} />
					{/* custodial */}
					<Txt txt={t('custodialRisk')} bold styles={[styles.header, { color: color.TEXT }]} />
					<Txt txt={t('custodialRiskContent')} styles={[{ color: color.TEXT_SECONDARY }]} />
					<Separator style={[styles.separator]} />
					{/* loss */}
					<Txt txt={t('lossOfTokens')} bold styles={[styles.header, { color: color.TEXT }]} />
					<Txt txt={t('lossContent')} styles={[{ color: color.TEXT_SECONDARY }]} />
					<Separator style={[styles.separator]} />
					{/* cashu */}
					<Txt txt={t('cashuExperiment')} bold styles={[styles.header, { color: color.TEXT }]} />
					<Txt txt={t('cashuContent')} styles={[{ color: color.TEXT_SECONDARY }]} />
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
		fontSize: 18,
		marginBottom: 10,
	},
	subheader: {
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
		justifyContent: 'space-between',
		paddingBottom: 20
	}
})