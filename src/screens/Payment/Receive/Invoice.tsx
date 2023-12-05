import ActionButtons from '@comps/ActionButtons'
import Button from '@comps/Button'
import { ShareIcon, WalletIcon } from '@comps/Icons'
import Loading from '@comps/Loading'
import QR from '@comps/QR'
import Txt from '@comps/Txt'
import { _testmintUrl, isIOS } from '@consts'
import { getAllInvoices } from '@db'
import { l } from '@log'
import type { TMintInvoicePageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { addToHistory } from '@store/latestHistoryEntries'
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
		try {
			const allInvoices = (await getAllInvoices()).map(i => i.pr)
			const { success } = await requestToken(mintUrl, amount, hash)
			/*
			it is possible that success is false but invoice has
			been paid and token have been issued due to the double
			check in the background...(requestTokenLoop())
			So we check if the invoice is in the db and if it is
			not then we check if the invoice has expired and if
			it has not then we assume that the invoice has been
			paid and token have been issued.
			*/
			if (success || (!allInvoices.includes(paymentRequest) && expire > 0)) {
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
				txt={t('cancel')}
				handlePress={() => void handlePayment(true)}
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