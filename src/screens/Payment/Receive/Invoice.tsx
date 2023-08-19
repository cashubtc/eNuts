import Button, { TxtButton } from '@comps/Button'
import useCopy from '@comps/hooks/Copy'
import { CheckmarkIcon, CopyIcon, WalletIcon } from '@comps/Icons'
import QR from '@comps/QR'
import { l } from '@log'
import type { TMintInvoicePageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getBalance } from '@src/storage/db'
import { addToHistory } from '@store/HistoryStore'
import { globals, highlight as hi, mainColors } from '@styles'
import { formatMintUrl, formatSeconds, isErr, openUrl } from '@util'
import { requestToken } from '@wallet'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function InvoiceScreen({ navigation, route }: TMintInvoicePageProps) {
	const { mintUrl, amount, hash, expiry, paymentRequest } = route.params
	const { openPromptAutoClose } = usePromptContext()
	const insets = useSafeAreaInsets()
	const { t } = useTranslation([NS.common])
	const { color, highlight, theme } = useThemeContext()
	const [expire, setExpire] = useState(expiry)
	const [expiryTime,] = useState(expire * 1000 + Date.now())
	const [paid, setPaid] = useState('')
	const { copied, copy } = useCopy()

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
				screenName={t('payInvoice', { ns: NS.wallet })}
				txt={t('backToDashboard')}
				handlePress={() => navigation.navigate('dashboard')}
			/>
			<View style={styles.invoiceWrap}>
				<View style={theme === 'Dark' ? styles.qrCodeWrap : undefined}>
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
			</View>
			{expire > 0 && (!paid || paid === 'unpaid') ?
				<View style={[styles.lnBtnWrap, { marginBottom: insets.bottom }]}>
					<Button
						outlined
						txt={t(paid === 'unpaid' ? 'paymentPending' : 'checkPayment')}
						onPress={() => void handlePayment()}
						// icon={paid === 'unpaid' ? <SandClockIcon color={hi[highlight]} /> : <CheckmarkIcon color={hi[highlight]} />}
					/>
					<View style={{ marginVertical: 10 }} />
					<Button
						txt={t('payWithLn')}
						onPress={() => {
							void (async () => {
								await openUrl(`lightning:${paymentRequest}`)?.catch(e =>
									openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') }))
							})()
						}}
						icon={<WalletIcon color='#FAFAFA' />}
					/>
					<TxtButton
						txt={copied ? t('copied') + '!' : t('copyInvoice')}
						icon={copied ? <CheckmarkIcon color={hi[highlight]} /> : <CopyIcon width={24} height={24} color={hi[highlight]} />}
						disabled={copied}
						onPress={() => void copy(paymentRequest)}
					/>
				</View>
				:
				<Button
					txt={t('backToDashboard')}
					onPress={() => navigation.navigate('dashboard')}
				/>
			}
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