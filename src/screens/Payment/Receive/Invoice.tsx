import Button, { TxtButton } from '@comps/Button'
import useCopy from '@comps/hooks/Copy'
import { CheckmarkIcon, CopyIcon, ShareIcon, WalletIcon } from '@comps/Icons'
import QR from '@comps/QR'
import { l } from '@log'
import type { TMintInvoicePageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getBalance } from '@src/storage/db'
import { addToHistory } from '@store/latestHistoryEntries'
import { globals, highlight as hi, mainColors } from '@styles'
import { formatMintUrl, formatSeconds, isErr, openUrl } from '@util'
import { requestToken } from '@wallet'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
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
				navigation.navigate('success', { amount, mint: formatMintUrl(mintUrl) })
				return
			}
			setPaid('unpaid')
			// reset state
			setTimeout(() => setPaid(''), 3000)
		}
	}

	const handleShare = async () => {
		try {
			const res = await Share.share({
				message: paymentRequest,
			})
			if (res.action === Share.sharedAction) {
				if (res.activityType) {
					// shared with activity type of result.activityType
					l('shared with activity type of result.activityType')
				} else {
					// shared
					l('shared')
				}
			} else if (res.action === Share.dismissedAction) {
				// dismissed
				l('sharing dismissed')
			}
		} catch (e) {
			l(e)
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
				<TouchableOpacity
					onPress={() => void copy(paymentRequest)}
					style={styles.copyWrap}
				>
					{copied ?
						<CheckmarkIcon color={mainColors.VALID} />
						:
						<CopyIcon color={color.TEXT} />
					}
					<Text style={[styles.invoiceStr, { color: color.TEXT }]}>
						{paymentRequest.substring(0, 30) + '...' || t('smthWrong')}
					</Text>
				</TouchableOpacity>
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
						icon={<WalletIcon color={mainColors.WHITE} />}
					/>
					<TxtButton
						txt={t('shareInvoice')}
						icon={<ShareIcon width={24} height={24} color={hi[highlight]} />}
						onPress={() => void handleShare()}
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
		borderColor: mainColors.WHITE
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
	checkPaymentTxt: {
		fontSize: 16,
		fontWeight: '500',
		marginTop: 10,
		textAlign: 'center',
	},
	lnBtnWrap: {
		width: '100%'
	},
})