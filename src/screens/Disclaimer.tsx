import { ChevronRightIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TDisclaimerPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

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
			<ScrollView style={styles.scrollContainer} alwaysBounceVertical={false}>
				<View style={styles.container}>
					<Txt
						txt={t('disclaimerHint', { ns: NS.common })}
						bold
						styles={[styles.subheader]}
					/>
					<View style={[globals(color).wrapContainer, { marginBottom: 20 }]}>
						<TouchableOpacity
							onPress={() => navigation.navigate('Settings')}
							style={styles.shareFeedback}
						>
							<Txt txt={t('shareOrReport', { ns: NS.common })} bold styles={[{ fontSize: vs(16) }]} />
							<ChevronRightIcon color={color.TEXT} />
						</TouchableOpacity>
					</View>
					<View style={{ marginHorizontal: s(20) }}>
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
				</View>
			</ScrollView>
		</View>
	)
}

const styles = ScaledSheet.create({
	scrollContainer: {
		marginTop: '90@vs',
		marginBottom: isIOS ? '20@vs' : '0@vs',
	},
	container: {
		paddingTop: '5@vs',
		paddingBottom: '20@vs',
	},
	header: {
		fontSize: '16@vs',
		marginBottom: '10@vs',
	},
	subheader: {
		paddingHorizontal: '20@s',
		marginBottom: '20@vs',
	},
	separator: {
		marginVertical: '20@vs',
	},
	ok: {
		position: 'absolute',
		bottom: '20@vs',
		right: '20@s',
		left: '20@s',
	},
	shareFeedback: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingBottom: '20@vs',
	}
})