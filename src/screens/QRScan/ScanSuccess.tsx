import Button, { TxtButton } from '@comps/Button'
import Logo from '@comps/Logo'
import type { TBeforeRemoveEvent, TScanSuccessPageProps } from '@model/nav'
import { preventBack } from '@nav/utils'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { formatMintUrl } from '@util'
import AnimatedLottieView from 'lottie-react-native'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, StyleSheet, Text, View } from 'react-native'

export default function ScanSuccessScreen({ navigation, route }: TScanSuccessPageProps) {

	const { mintUrl, npub } = route.params
	const { t } = useTranslation([NS.mints])
	const { color } = useThemeContext()

	const handleTopUp = () => {
		if (!mintUrl) { return }
		navigation.navigate('selectAmount', {
			mint: { mintUrl, customName: '' },
			balance: 0,
		})
	}

	const handleContacts = () => {
		if (!npub) { return }
		navigation.navigate('Address book')
	}

	// prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
	useEffect(() => {
		const backHandler = (e: TBeforeRemoveEvent) => preventBack(e, navigation.dispatch)
		navigation.addListener('beforeRemove', backHandler)
		return () => navigation.removeListener('beforeRemove', backHandler)
	}, [navigation])

	return (
		<View style={[globals(color).container, styles.container]}>
			<View />
			<View style={styles.infoWrap}>
				<Logo size={100} success />
				<Text style={[styles.successTxt, { color: color.TEXT }]}>
					{mintUrl ? t('newMintAdded') : t('npubAdded', { ns: NS.common })}
				</Text>
				<Text style={[styles.mint, { color: color.TEXT_SECONDARY }]}>
					{mintUrl ? formatMintUrl(mintUrl) : npub}
				</Text>
				<AnimatedLottieView
					imageAssetsFolder='lottie/success'
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					source={require('../../../assets/lottie/success/success.json')}
					autoPlay
					loop={false}
					style={{ width: 130 }}
				/>
			</View>
			<SafeAreaView style={styles.actionWrap}>
				<Button
					txt={mintUrl ? t('topUpNow', { ns: NS.common }) : t('showContacts', { ns: NS.common })}
					onPress={() => {
						if (mintUrl) { return handleTopUp()}
						handleContacts()
					}}
				/>
				<View style={{ marginVertical: 10 }} />
				<Button
					txt={t('scanAnother', { ns: NS.common })}
					outlined
					onPress={() => navigation.navigate('qr scan', {})}
				/>
				<TxtButton
					txt={t('backToDashboard', { ns: NS.common })}
					onPress={() => navigation.navigate('dashboard')}
				/>
			</SafeAreaView>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 20
	},
	infoWrap: {
		alignItems: 'center',
	},
	actionWrap: {
		width: '100%',
	},
	successTxt: {
		fontSize: 30,
		fontWeight: '800',
		textAlign: 'center',
		marginTop: 30,
	},
	mint: {
		marginVertical: 20,
		fontSize: 16,
		textAlign: 'center',
		fontWeight: '500',
	},
})