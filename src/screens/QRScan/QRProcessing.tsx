import Loading from '@comps/Loading'
import Txt from '@comps/Txt'
import { getMintsBalances } from '@db'
import { l } from '@log'
import type { TBeforeRemoveEvent, TQRProcessingPageProps } from '@model/nav'
import { preventBack } from '@nav/utils'
import { useHistoryContext } from '@src/context/History'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { isErr } from '@src/util'
import { getCustomMintNames } from '@store/mintStore'
import { globals } from '@styles'
import { checkFees, claimToken } from '@wallet'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'

export default function QRProcessingScreen({ navigation, route }: TQRProcessingPageProps) {
	const { t } = useTranslation([NS.mints])
	const { color } = useThemeContext()
	const { addHistoryEntry } = useHistoryContext()
	const { tokenInfo, token, ln } = route.params

	const getProcessingtxt = () => {
		if (token && tokenInfo) { return 'claiming' }
		return 'processingInvoice'
	}

	const receiveToken = async () => {
		if (!tokenInfo || !token) {
			navigation.navigate('processingError', {
				errorMsg: t('tokenInfoErr', { ns: NS.common })
			})
			return
		}
		const success = await claimToken(token).catch(l)
		if (!success) {
			navigation.navigate('processingError', {
				errorMsg: t('invalidOrSpent', { ns: NS.common })
			})
			return
		}
		// add as history entry (receive ecash)
		await addHistoryEntry({
			amount: tokenInfo.value,
			type: 1,
			value: token,
			mints: tokenInfo.mints,
		})
		// success prompt
		navigation.navigate('success', {
			amount: tokenInfo.value,
			memo: tokenInfo.decoded.memo,
			isClaim: true,
			isScanned: true
		})
	}

	const handleInvoice = async () => {
		if (!ln) {
			navigation.navigate('processingError', {
				errorMsg: t('invoiceScanError', { ns: NS.error }),
				scan: true
			})
			return
		}
		const { invoice, mint, balance, amount } = ln
		try {
			// user already has selected the mint in the previous screens
			if (mint && balance) {
				// check if invoice amount is higher than the selected mint balance to avoid navigating
				const estFee = await checkFees(mint.mintUrl, invoice)
				if (amount + estFee > balance) {
					navigation.navigate('processingError', {
						errorMsg: t('noFundsForFee', { ns: NS.common, fee: estFee }),
						scan: true
					})
					return
				}
				navigation.navigate('coinSelection', {
					mint,
					balance,
					amount,
					estFee,
					recipient: invoice,
					isMelt: true,
					scanned: true
				})
				return
			}
			// user has not selected the mint yet (Pressed scan QR and scanned a Lightning invoice)
			const mintsWithBal = await getMintsBalances()
			const mints = await getCustomMintNames(mintsWithBal.map(m => ({ mintUrl: m.mintUrl })))
			const nonEmptyMint = mintsWithBal.filter(m => m.amount > 0)
			// user has no funds
			if (!nonEmptyMint.length) {
				// user is redirected to the mint selection screen where he gets an appropriate message
				navigation.navigate('selectMint', {
					mints,
					mintsWithBal,
					isMelt: true,
					invoice,
					invoiceAmount: amount,
					allMintsEmpty: true,
					scanned: true
				})
				return
			}
			// user has funds, select his first mint for the case that he has only one
			const mintUsing = mints.find(m => m.mintUrl === nonEmptyMint[0].mintUrl) || { mintUrl: 'N/A', customName: 'N/A' }
			const estFee = await checkFees(mintUsing.mintUrl, ln.invoice)
			if (nonEmptyMint.length === 1 && amount + estFee > nonEmptyMint[0].amount) {
				navigation.navigate('processingError', {
					errorMsg: t('noFundsForFee', { ns: NS.common, fee: estFee }),
					scan: true
				})
				return
			}
			// user has only 1 mint with enough balance, he can directly navigate to the payment overview page
			if (nonEmptyMint.length === 1) {
				if (nonEmptyMint[0].amount < amount + estFee) {
					navigation.navigate('processingError', {
						errorMsg: t('noFunds', { ns: NS.common }),
						scan: true
					})
					return
				}
				navigation.navigate('coinSelection', {
					mint: mintUsing,
					balance: nonEmptyMint[0].amount,
					amount,
					estFee,
					recipient: invoice,
					isMelt: true,
					scanned: true
				})
				return
			}
			if (mintsWithBal.some(m => m.amount >= amount + estFee)) {
				// user needs to select mint from which he wants to pay the invoice
				navigation.navigate('selectMint', {
					mints,
					mintsWithBal,
					allMintsEmpty: !nonEmptyMint.length,
					invoiceAmount: amount,
					estFee,
					invoice,
					isMelt: true,
					scanned: true
				})
			} else {
				navigation.navigate('processingError', {
					errorMsg: t('noFunds', { ns: NS.common }),
					scan: true
				})
			}
		} catch (e) {
			navigation.navigate('processingError', {
				errorMsg: isErr(e) ? e.message : t('invoiceScanError', { ns: NS.error }),
				scan: true
			})
		}
	}

	// start process
	useEffect(() => {
		if (token && tokenInfo) {
			void receiveToken()
			return
		}
		void handleInvoice()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tokenInfo])

	// prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
	useEffect(() => {
		const backHandler = (e: TBeforeRemoveEvent) => preventBack(e, navigation.dispatch)
		navigation.addListener('beforeRemove', backHandler)
		return () => navigation.removeListener('beforeRemove', backHandler)
	}, [navigation])

	return (
		<View style={[globals(color).container, styles.container]}>
			<Loading size={40} />
			<Txt
				styles={[styles.descText]}
				txt={t(getProcessingtxt(), { ns: NS.wallet })}
			/>
			<Txt styles={[styles.hint, { color: color.TEXT_SECONDARY }]} txt={t('invoiceHint')} />
		</View>
	)
}

const styles = ScaledSheet.create({
	container: {
		paddingTop: 0,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: '20@s',
	},
	descText: {
		marginTop: '20@vs',
		textAlign: 'center',
	},
	hint: {
		fontSize: '12@vs',
		marginTop: '10@vs',
	}
})