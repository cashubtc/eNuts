import Button from '@comps/Button'
import Logo from '@comps/Logo'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TSuccessPageProps } from '@model/nav'
import { useFocusEffect } from '@react-navigation/core'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { l } from '@src/logger'
import { mainColors } from '@styles'
import { formatInt, vib } from '@util'
import LottieView from 'lottie-react-native'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackHandler, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function SuccessPage({ navigation, route }: TSuccessPageProps) {
	const { amount, memo, fee, mint, isClaim, isMelt, nostr } = route.params
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const insets = useSafeAreaInsets()
	const [shouldHide, setShouldHide] = useState(false)

	useEffect(() => vib(400), [])

	// prevent android back button to go back to previous nav screen
	useFocusEffect(
		useCallback(() => {
			setShouldHide(false)
			const onBackPress = () => true
			BackHandler.addEventListener('hardwareBackPress', onBackPress)
			return () => {
				BackHandler.removeEventListener('hardwareBackPress', onBackPress)
				setShouldHide(true)
			}
		}, [])
	)

	l('render success page')

	return shouldHide ? null : (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<Logo size={250} style={styles.img} success />
			<View style={{ width: '100%' }}>
				<Text style={[styles.successTxt, { color: color.TEXT }]}>
					{nostr &&
						<>
							{formatInt(amount || 0)} Satoshi {t('nostrPaymentSuccess')}!
						</>
					}
					{isMelt ?
						t('paymentSuccess')
						:
						!nostr ?
							<>{formatInt(amount || 0)} Satoshi {isClaim ? t('claimed') : t('minted')}!</>
							:
							null
					}
				</Text>
				{memo &&
					<Text style={[styles.mints, { color: color.TEXT_SECONDARY }]}>
						{memo}
					</Text>
				}
				{mint && mint.length > 0 &&
					<Text style={[styles.mints, { color: color.TEXT_SECONDARY }]}>
						{mint}
					</Text>
				}
				<View style={styles.successAnim}>
					<LottieView
						imageAssetsFolder='lottie/success'
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						source={require('../../../main/assets/lottie/success/success.json')}
						autoPlay
						loop={false}
						style={{ width: 130 }}
					/>
				</View>
				{mint && mint.length > 0 &&
					<Txt txt={t('EcashRdy')} styles={[styles.rdy]} />
				}
				{isMelt && amount &&
					<View style={styles.meltWrap}>
						<View style={styles.meltOverview}>
							<Txt txt={t('paidOut', { ns: NS.wallet })} styles={[styles.meltTxt]} />
							<Txt txt={`${amount} Satoshi`} styles={[styles.meltTxt]} />
						</View>
						<View style={styles.meltOverview}>
							<Txt txt={t('fee')} styles={[styles.meltTxt]} />
							<Txt txt={`${fee} Satoshi`} styles={[styles.meltTxt]} />
						</View>
						<View style={styles.meltOverview}>
							<Txt txt={t('totalInclFee')} styles={[styles.meltTxt]} />
							<Txt txt={`${amount + (fee || 0)} Satoshi`} styles={[styles.meltTxt]} />
						</View>
					</View>
				}
			</View>
			<View style={[styles.btnWrap, { marginBottom: isIOS ? insets.bottom : 20 }]}>
				<Button txt={t('backToDashboard')} onPress={() => navigation.navigate('dashboard')} />
			</View>
			<LottieView
				imageAssetsFolder='lottie/confetti'
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				source={require('../../../main/assets/lottie/success/confetti.json')}
				autoPlay
				loop={false}
				style={styles.confetti}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},
	img: {
		marginTop: 100,
		height: 100,
		opacity: .8
	},
	successTxt: {
		fontSize: 30,
		fontWeight: '800',
		textAlign: 'center',
		marginTop: 30,
	},
	meltWrap: {
		width: '100%',
		marginTop: 20,
	},
	meltOverview: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10,
	},
	meltTxt: {
		color: mainColors.WHITE,
		fontWeight: '500'
	},
	mints: {
		marginTop: 20,
		fontSize: 16,
		textAlign: 'center',
		fontWeight: '500',
	},
	btnWrap: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		left: 0,
		paddingHorizontal: 20,
	},
	rdy: {
		textAlign: 'center',
		marginTop: 20,
		fontSize: 20
	},
	confetti: {
		width: 400,
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: -300,
		left: 0,
		zIndex: -1
	},
	successAnim: {
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 20
	}
})