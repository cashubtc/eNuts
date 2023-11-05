import Button from '@comps/Button'
import { ShareIcon } from '@comps/Icons'
import QR from '@comps/QR'
import Txt from '@comps/Txt'
import type { TBeforeRemoveEvent, TEncodedTokenPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { preventBack } from '@nav/utils'
import { isIOS } from '@src/consts'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { historyStore, store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { globals, highlight as hi } from '@styles'
import { formatInt, formatSatStr, share, vib } from '@util'
import { isTokenSpendable } from '@wallet'
import LottieView from 'lottie-react-native'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'

/**
 * The page that shows the created Cashu token that can be scanned, copied or shared
 */
export default function EncodedTokenPage({ navigation, route }: TEncodedTokenPageProps) {
	const { value, amount } = route.params.entry
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const [error, setError] = useState({ msg: '', open: false })
	const [spent, setSpent] = useState(false)
	const intervalRef = useRef<NodeJS.Timeout | null>(null)

	const clearTokenInterval = () => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
		}
	}

	const checkPayment = async () => {
		const isSpendable = await isTokenSpendable(value)
		setSpent(!isSpendable)
		if (!isSpendable) {
			clearTokenInterval()
			// update history item
			await historyStore.updateHistoryEntry(route.params.entry, { ...route.params.entry, isSpent: true })
		}
	}

	useEffect(() => {
		// we can save the created token here to avoid foreground prompts of self-created tokens
		void store.set(STORE_KEYS.createdToken, value)
		vib(400)
	}, [value])

	// prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
	useEffect(() => {
		const backHandler = (e: TBeforeRemoveEvent) => preventBack(e, navigation.dispatch)
		navigation.addListener('beforeRemove', backHandler)
		return () => navigation.removeListener('beforeRemove', backHandler)
	}, [navigation])

	// auto check payment in intervals
	useEffect(() => {
		intervalRef.current = setInterval(() => {
			void checkPayment()
		}, 3000)
		return () => clearTokenInterval()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<View style={[globals(color).container, styles.container, { paddingBottom: isIOS ? 50 : 20 }]}>
			{!spent &&
				<TopNav
					withBackBtn
					screenName={`${t('newToken')}  🥜🐿️`}
					handlePress={() => navigation.navigate('dashboard')}
				/>
			}
			{spent ?
				<>
					<View />
					<View>
						<Text style={[styles.successTxt, { color: color.TEXT }]}>
							{t('isSpent', { ns: NS.history })}
						</Text>
						<View style={styles.successAnim}>
							<LottieView
								imageAssetsFolder='lottie/success'
								// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
								source={require('../../../../assets/lottie/success/success.json')}
								autoPlay
								loop={false}
								style={{ width: 130 }}
							/>
						</View>
					</View>
					<Button
						txt={t('backToDashboard')}
						onPress={() => navigation.navigate('dashboard')}
					/>
				</>
				:
				<>
					{/* The amount of the created token */}
					<View style={styles.qrWrap}>
						<Txt txt={formatInt(amount < 0 ? Math.abs(amount) : amount)} styles={[styles.tokenAmount, { color: hi[highlight] }]} />
						<Txt txt={formatSatStr(amount, 'standard', false)} styles={[styles.tokenFormat]} />
						{/* The QR code */}
						{error.open ?
							<Txt txt={error.msg} styles={[globals(color).navTxt, styles.errorMsg]} />
							:
							<QR
								size={320}
								value={value}
								onError={() => setError({ msg: t('bigQrMsg'), open: true })}
							/>
						}
					</View>
					<Button
						outlined
						txt={t('share')}
						onPress={() => void share(value, `cashu://${value}`)}
						icon={<ShareIcon width={18} height={18} color={hi[highlight]} />}
					/>
				</>
			}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		paddingTop: 0,
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
		padding: 20,
	},
	qrWrap: {
		alignItems: 'center',
		marginTop: 100,
	},
	tokenAmount: {
		fontSize: 42,
		fontWeight: '500',
		marginTop: 25,
	},
	tokenFormat: {
		marginBottom: 25,
	},
	errorMsg: {
		marginVertical: 25,
		textAlign: 'center',
	},
	successTxt: {
		fontSize: 30,
		fontWeight: '800',
		textAlign: 'center',
		marginTop: 30,
	},
	successAnim: {
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 20
	}
})