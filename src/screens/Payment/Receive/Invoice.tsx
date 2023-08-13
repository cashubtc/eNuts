import Button from '@comps/Button'
import QR from '@comps/QR'
import { l } from '@log'
import type { TMintInvoicePageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { getBalance } from '@src/storage/db'
import { addToHistory } from '@store/HistoryStore'
import { dark, globals, highlight as hi, mainColors } from '@styles'
import { formatMintUrl, formatSeconds, isErr, openUrl } from '@util'
import { requestToken } from '@wallet'
import * as Clipboard from 'expo-clipboard'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function InvoiceScreen({ navigation, route }: TMintInvoicePageProps) {
	const { mintUrl, amount, hash, expiry, paymentRequest } = route.params
	const { openPromptAutoClose } = usePromptContext()
	const insets = useSafeAreaInsets()
	const { t } = useTranslation(['common'])
	const { color, highlight } = useThemeContext()
	const [expire, setExpire] = useState(expiry)
	const [expiryTime,] = useState(expire * 1000 + Date.now())
	const [paid, setPaid] = useState('')
	const [copied, setCopied] = useState(false)

	const handlePayment = async () => {
		// state "unpaid" is temporary to prevent btn press spam
		if (paid === 'unpaid') { return }
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
				setPaid('paid')
				navigation.navigate('success', { amount, mint: formatMintUrl(mintUrl) })
			}
		} catch (e) {
			l(e)
			// TODO update this check
			if (isErr(e) && e.message === 'Tokens already issued for this invoice.') {
				setPaid('paid')
				return
			}
			setPaid('unpaid')
			// reset state
			setTimeout(() => setPaid(''), 3000)
		}
	}

	// countdown
	useEffect(() => {
		const timeLeft = Math.ceil((expiryTime - Date.now()) / 1000)
		if (timeLeft < 0) {
			setExpire(0)
			return
		}
		if (expire && expire > 0) {
			setTimeout(() => setExpire(timeLeft - 1), 1000)
		}
	}, [expire, expiryTime])

	return (
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				screenName={t('payInvoice', { ns: 'wallet' })}
				cancel
				handlePress={() => navigation.navigate('dashboard')}
			/>
			<View style={styles.invoiceWrap}>
				<View style={color.BACKGROUND === dark.colors.background ? styles.qrCodeWrap : undefined}>
					<QR
						size={275}
						value={paymentRequest}
						onError={() => l('Error while generating the LN QR code')}
					/>
				</View>
				<Text style={[styles.lnAddress, { color: color.TEXT }]}>
					{paymentRequest.substring(0, 40) + '...' || t('smthWrong')}
				</Text>
			</View>
			<View>
				<Text style={[styles.lnExpiry, { color: expire < 1 ? mainColors.ERROR : hi[highlight], fontSize: 28 }]}>
					{expire > 0 ?
						formatSeconds(expire)
						:
						t('invoiceExpired') + '!'
					}
				</Text>
				{expire > 0 && (!paid || paid === 'unpaid') &&
					<TouchableOpacity onPress={() => void handlePayment()}>
						<Text style={[styles.checkPaymentTxt, { color: hi[highlight] }]}>
							{t('checkPayment')}
						</Text>
					</TouchableOpacity>
				}
				{paid === 'unpaid' &&
					<Text style={styles.pendingTxt}>
						{t('paymentPending')}...
					</Text>
				}
			</View>
			<View style={[styles.lnBtnWrap, { marginBottom: insets.bottom }]}>
				<Button
					txt={copied ? t('copied') + '!' : t('copyInvoice')}
					outlined
					onPress={() => {
						void Clipboard.setStringAsync(paymentRequest).then(() => {
							setCopied(true)
							const t = setTimeout(() => {
								setCopied(false)
								clearTimeout(t)
							}, 3000)
						})
					}}
				/>
				<View style={{ marginBottom: 20 }} />
				<Button
					txt={t('payWithLn')}
					onPress={() => {
						void (async () => {
							await openUrl(`lightning:${paymentRequest}`)?.catch(e =>
								openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') }))
						})()
					}}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 20,
		paddingTop: 140,
	},
	invoiceWrap: {
		alignItems: 'center',
	},
	qrCodeWrap: {
		borderWidth: 5,
		borderColor: '#FFF'
	},
	lnAddress: {
		fontSize: 14,
		marginTop: 20,
	},
	lnExpiry: {
		fontSize: 36,
		fontWeight: '600',
		textAlign: 'center',
	},
	checkPaymentTxt: {
		fontSize: 16,
		fontWeight: '500',
		marginTop: 10,
		textAlign: 'center',
	},
	pendingTxt: {
		fontSize: 16,
		fontWeight: '500',
		color: '#F1C232',
		marginTop: 10,
		textAlign: 'center',
	},
	lnBtnWrap: {
		width: '100%'
	},
})