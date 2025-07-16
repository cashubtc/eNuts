import Button from '@comps/Button'
import { BatteryChargingIcon, CloseIcon, HomeWifiIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { IRestoreWarningPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { mainColors } from '@styles'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function RestoreWarningScreen({ navigation, route }: IRestoreWarningPageProps) {
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
					<View style={styles.overview}>
						{/* battery */}
						<View style={[styles.entryWrap, { paddingBottom: s(12) }]}>
							<BatteryChargingIcon width={s(52)} height={s(52)} color={mainColors.BLUE} />
						</View>
						<Txt center txt={t('restoreBattery', { ns: NS.common })} bold styles={[styles.header, { color: color.TEXT }]} />
						<Txt center txt={t('restoreBatteryHint', { ns: NS.common })} styles={[{ color: color.TEXT_SECONDARY, marginBottom: s(20) }]} />
						{/* wifi */}
						<View style={[styles.entryWrap, { paddingBottom: s(20) }]}>
							<HomeWifiIcon width={s(46)} height={s(46)} color={mainColors.VALID} />
						</View>
						<Txt center txt={t('restoreWifi', { ns: NS.common })} bold styles={[styles.header, { color: color.TEXT }]} />
						<Txt center txt={t('restoreWifiHint', { ns: NS.common })} styles={[{ color: color.TEXT_SECONDARY, marginBottom: s(20) }]} />
						{/* keep app open */}
						<View style={[styles.entryWrap, { paddingBottom: s(15) }]}>
							<CloseIcon width={s(46)} height={s(46)} color={mainColors.ERROR} />
						</View>
						<Txt center txt={t('restoreForeground', { ns: NS.common })} bold styles={[styles.header, { color: color.TEXT }]} />
						<Txt center txt={t('restoreForegroundHint', { ns: NS.common })} styles={[{ color: color.TEXT_SECONDARY, marginBottom: s(20) }]} />
					</View>
				</View>
				<View style={styles.btnWrap}>
					<Button
						outlined
						txt='OK'
						onPress={() => {
							navigation.navigate('Select recovery mint', {
								comingFromOnboarding: route.params?.comingFromOnboarding
							})
						}}
					/>
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
	ok: {
		position: 'absolute',
		bottom: '20@vs',
		right: '20@s',
		left: '20@s',
	},
	overview: {
		marginHorizontal: '20@s'
	},
	entryWrap: {
		alignItems: 'center',
		padding: '30@s',
	},
	btnWrap: {
		paddingHorizontal: '20@s',
		paddingBottom: '20@s'
	}
})