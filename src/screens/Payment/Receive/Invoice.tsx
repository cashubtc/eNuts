import Button, { TxtButton } from '@comps/Button'
import { ShareIcon, WalletIcon } from '@comps/Icons'
import Loading from '@comps/Loading'
import QR from '@comps/QR'
import Txt from '@comps/Txt'
import { l } from '@log'
import type { TMintInvoicePageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { _testmintUrl } from '@src/consts'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getBalance } from '@src/storage/db'
import { addToHistory } from '@store/latestHistoryEntries'
import { globals, highlight as hi, mainColors } from '@styles'
import { getColor } from '@styles/colors'
import { formatMintUrl, formatSeconds, isErr, openUrl, share } from '@util'
import { requestToken } from '@wallet'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function InvoiceScreen({ navigation, route }: TMintInvoicePageProps) {
	const { mintUrl, amount, hash, expiry, paymentRequest } = route.params
	const { openPromptAutoClose } = usePromptContext()
	const insets = useSafeAreaInsets()
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const intervalRef = useRef<NodeJS.Timeout | null>(null)
	const [expire, setExpire] = useState(expiry)
	const [expiryTime,] = useState(expire * 1000 + Date.now())
	const [paid, setPaid] = useState('')

	const clearInvoiceInterval = () => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
		}
	}

	const handlePayment = async (isCancelling?: boolean) => {
		const previousBalance = await getBalance()
		try {
			const { success } = await requestToken(mintUrl, amount, hash)
			const newBalance = await getBalance()
			// it is possible that success is false but invoice has been paid...
			if (success || newBalance > previousBalance) {
				// add as history entry
				await addToHistory({
					amount,
					type: 2,
					value: paymentRequest,
					mints: [mintUrl],
				})
				clearInvoiceInterval()
				navigation.navigate('success', { amount, mint: formatMintUrl(mintUrl) })
			}
		} catch (e) {
			if (isErr(e) && e.message === 'tokens already issued for this invoice.') {
				await addToHistory({
					amount,
					type: 2,
					value: paymentRequest,
					mints: [mintUrl],
				})
				clearInvoiceInterval
				navigation.navigate('success', { amount, mint: formatMintUrl(mintUrl) })
				return
			}
			setPaid('unpaid')
			if (isCancelling) {
				navigation.navigate('dashboard')
			}
		}
	}

	// countdown
	useEffect(() => {
		const timeLeft = Math.ceil((expiryTime - Date.now()) / 1000)
		if (timeLeft < 0 || paid === 'paid') {
			setExpire(0)
			return
		}
		if (expire && expire > 0) {
			setTimeout(() => setExpire(timeLeft - 1), 1000)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [expire, expiryTime])

	// auto check payment in intervals
	useEffect(() => {
		intervalRef.current = setInterval(() => {
			void handlePayment()
		}, 3000)
		return () => clearInvoiceInterval()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				screenName={t('payInvoice', { ns: NS.wallet })}
				txt={t('backToDashboard')}
				handlePress={() => void handlePayment(true)}
			/>
			<QR
				size={300}
				value={paymentRequest}
				onError={() => l('Error while generating the LN QR code')}
				isInvoice
			/>
			<View>
				<Text style={[styles.lnExpiry, { color: expire < 1 ? mainColors.ERROR : hi[highlight], fontSize: 28 }]}>
					{expire > 0 ?
						formatSeconds(expire)
						:
						mintUrl === _testmintUrl ?
							t('processTestPay')
							:
							t('invoiceExpired') + '!'
					}
				</Text>
				{mintUrl === _testmintUrl && <View style={{ marginTop: 20 }}><Loading /></View>}
				{expire > 0 &&
					<View style={styles.awaitingWrap}>
						<Txt txt={t('paymentPending') + '...'} styles={[{ fontWeight: '500', marginRight: 10 }]} />
						<Loading />
					</View>
				}
			</View>
			{expire > 0 && (!paid || paid === 'unpaid') ?
				<View style={[styles.lnBtnWrap, { marginBottom: insets.bottom }]}>
					<Button
						txt={t('payWithLn')}
						onPress={() => {
							void openUrl(`lightning:${paymentRequest}`)?.catch(e =>
								openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') }))
						}}
						icon={<WalletIcon color={getColor(highlight, color)} />}
					/>
					<TxtButton
						txt={t('shareInvoice')}
						icon={<ShareIcon width={18} height={18} color={hi[highlight]} />}
						onPress={() => void share(paymentRequest)}
					/>
				</View>
				:
				mintUrl !== _testmintUrl ?
					<Button
						txt={t('backToDashboard')}
						onPress={() => navigation.navigate('dashboard')}
					/>
					: null
			}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 20,
		paddingTop: 120,
	},
	invoiceWrap: {
		alignItems: 'center',
	},
	copyWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 20,
	},
	invoiceStr: {
		fontSize: 14,
		marginLeft: 10,
	},
	lnExpiry: {
		fontSize: 36,
		fontWeight: '600',
		textAlign: 'center',
	},
	awaitingWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 10,
	},
	lnBtnWrap: {
		width: '100%'
	},
})