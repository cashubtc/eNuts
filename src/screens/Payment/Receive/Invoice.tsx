import ActionButtons from '@comps/ActionButtons'
import Button from '@comps/Button'
import { ShareIcon, WalletIcon } from '@comps/Icons'
import Loading from '@comps/Loading'
import QR from '@comps/QR'
import Txt from '@comps/Txt'
import { _testmintUrl, isIOS, MinuteInMs } from '@consts'
import { l } from '@log'
import type { IHistoryEntry } from '@model'
import type { TMintInvoicePageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { useHistoryContext } from '@src/context/History'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, highlight as hi, mainColors } from '@styles'
import { getColor } from '@styles/colors'
import { formatMintUrl, formatSeconds, isErr, openUrl, share } from '@util'
import { requestToken } from '@wallet'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

export default function InvoiceScreen({ navigation, route }: TMintInvoicePageProps) {
	const { mintUrl, amount, hash, expiry, paymentRequest } = route.params
	const { openPromptAutoClose } = usePromptContext()
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const {
		addHistoryEntry,
		updateHistoryEntry,
		startGlobalInvoiceInterval,
	} = useHistoryContext()
	const intervalRef = useRef<NodeJS.Timeout | null>(null)
	const [expire, setExpire] = useState(expiry)
	const [expiryTime,] = useState(expire * 1000 + Date.now())
	const [paid, setPaid] = useState('')

	const clearInvoiceInterval = () => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
		}
	}

	const handlePaidInvoice = async (entry: IHistoryEntry) => {
		clearInvoiceInterval()
		await updateHistoryEntry(entry, { ...entry, isPending: false })
		navigation.navigate('success', { amount, mint: formatMintUrl(mintUrl) })
	}

	const handlePayment = async (entry: IHistoryEntry) => {
		try {
			const { success } = await requestToken(mintUrl, amount, hash)
			if (success) {
				await handlePaidInvoice(entry)
			}
		} catch (e) {
			if (isErr(e) && e.message === 'tokens already issued for this invoice.') {
				await handlePaidInvoice(entry)
			}
			setPaid('unpaid')
		}
	}

	// countdown
	useEffect(() => {
		const timeLeft = Math.ceil((expiryTime - Date.now()) / 1000)
		if (timeLeft < 0 || paid === 'paid') {
			return setExpire(0)
		}
		if (expire && expire > 0) {
			setTimeout(() => setExpire(timeLeft - 1), 1000)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [expire, expiryTime])

	// auto check payment in intervals
	useEffect(() => {
		void (async () => {
			// add as pending history entry
			const entry = await addHistoryEntry({
				amount,
				type: 2,
				value: paymentRequest,
				mints: [mintUrl],
				isPending: true
			})
			// start checking for payment in 3s intervals
			intervalRef.current = setInterval(() => {
				l('checking pending invoices in invoice screen')
				void handlePayment(entry)
			}, MinuteInMs)
		})()
		return () => clearInvoiceInterval()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				screenName={t('payInvoice', { ns: NS.wallet })}
				txt={t('cancel')}
				handlePress={() => {
					// clear interval for current invoice check
					clearInvoiceInterval()
					// start global invoice check
					startGlobalInvoiceInterval()
					navigation.navigate('dashboard')
				}}
			/>
			<View style={styles.content}>
				<QR
					size={vs(250)}
					value={paymentRequest}
					onError={() => l('Error while generating the LN QR code')}
					isInvoice
				/>
				<View>
					<Text style={[styles.lnExpiry, { color: expire < 1 ? mainColors.ERROR : hi[highlight], fontSize: vs(22) }]}>
						{expire > 0 ?
							formatSeconds(expire)
							:
							mintUrl === _testmintUrl ?
								t('processTestPay')
								:
								t('invoiceExpired') + '!'
						}
					</Text>
					{mintUrl === _testmintUrl && <View style={{ marginTop: vs(20) }}><Loading /></View>}
					{expire > 0 &&
						<View style={styles.awaitingWrap}>
							<Txt txt={t('paymentPending') + '...'} styles={[{ fontWeight: '500', marginRight: s(10) }]} />
							<Loading />
						</View>
					}
				</View>
				{expire > 0 && (!paid || paid === 'unpaid') ?
					<ActionButtons
						topBtnTxt={t('payWithLn')}
						topBtnAction={() => {
							void openUrl(`lightning:${paymentRequest}`)?.catch(e =>
								openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') }))
						}}
						topIcon={<WalletIcon color={getColor(highlight, color)} />}
						bottomBtnTxt={t('shareInvoice')}
						bottomBtnAction={() => void share(paymentRequest)}
						bottomIcon={<ShareIcon width={s(18)} height={s(18)} color={hi[highlight]} />}
					/>
					:
					mintUrl !== _testmintUrl ?
						<Button
							txt={t('backToDashboard')}
							onPress={() => navigation.navigate('dashboard')}
						/>
						: null
				}
				{isIOS && <View style={styles.placeholder} />}
			</View>
		</View>
	)
}

const styles = ScaledSheet.create({
	container: {
		paddingHorizontal: '20@s',
		paddingBottom: '20@s',
	},
	content: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	lnExpiry: {
		fontSize: '34@vs',
		fontWeight: '600',
		textAlign: 'center',
	},
	awaitingWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: '5@vs',
	},
	placeholder: {
		height: '20@vs',
	}
})