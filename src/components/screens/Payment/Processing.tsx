import { getDecodedLnInvoice } from '@cashu/cashu-ts'
import Loading from '@comps/Loading'
import Txt from '@comps/Txt'
import { _testmintUrl } from '@consts'
import { l } from '@log'
import type { TProcessingPageProps } from '@model/nav'
import { ThemeContext } from '@src/context/Theme'
import { addLnPaymentToHistory, addToHistory } from '@store/HistoryStore'
import { globals } from '@styles'
import { getInvoiceFromLnurl, isErr, isLnurl } from '@util'
import { autoMintSwap, payLnInvoice, requestMint, requestToken, sendToken } from '@wallet'
import { useContext, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export default function ProcessingScreen({ navigation, route }: TProcessingPageProps) {
	const { t } = useTranslation(['mints'])
	const { color } = useContext(ThemeContext)
	const {
		mint,
		amount,
		memo,
		estFee,
		isMelt,
		isSendEcash,
		isSwap,
		targetMint,
		proofs,
		recipient
	} = route.params
	const handleError = (e?: unknown) => {
		// TODO check error screen msgs
		const translatedErrMsg = t(isMelt ? 'requestMintErr' : 'requestMintErr', { ns: 'error' })
		navigation.navigate('processingError', {
			amount,
			mint,
			errorMsg: isErr(e) ? e.message : translatedErrMsg
		})
	}
	const getProcessingtxt = () => {
		if (isMelt) { return 'processingPaymentByMint' }
		if (isSwap) { return 'processingSwap' }
		if (isSendEcash) { return 'creatingEcashToken' }
		return 'awaitingInvoice'
	}
	const handleMintingProcess = async () => {
		try {
			const resp = await requestMint(mint.mintUrl, amount)
			const decoded = getDecodedLnInvoice(resp.pr)
			// immediatly claim and navigate to success page for test-mint
			if (mint.mintUrl === _testmintUrl) {
				const { success, invoice } = await requestToken(mint.mintUrl, amount, resp.hash)
				if (!success) {
					handleError()
					return
				}
				// add as history entry
				await addToHistory({
					amount,
					type: 2,
					value: invoice?.pr || '',
					mints: [mint.mintUrl],
				})
				navigation.navigate('success', { amount, mint: mint.mintUrl })
				return
			}
			// navigate to invoice overview screen
			navigation.navigate('mintInvoice', {
				mintUrl: mint.mintUrl,
				amount,
				hash: resp.hash,
				expiry: decoded.expiry,
				paymentRequest: decoded.paymentRequest
			})
		} catch (e) {
			handleError(e)
		}
	}
	const handleMeltingProcess = async () => {
		if (!recipient?.length) { return }
		let invoice = ''
		// recipient can be a LNURL or a LN invoice
		if (isLnurl(recipient)) {
			try {
				invoice = await getInvoiceFromLnurl(recipient, +amount)
				if (!invoice?.length) {
					handleError()
					return
				}
			} catch (e) {
				handleError(e)
				return
			}
		}
		try {
			const res = await payLnInvoice(mint.mintUrl, invoice || recipient, estFee || 0, proofs || [])
			if (!res.result?.isPaid) {
				handleError()
				return
			}
			// payment success, add as history entry
			await addLnPaymentToHistory(
				res,
				[mint.mintUrl],
				-amount,
				invoice || recipient
			)
			navigation.navigate('success', {
				amount,
				fee: res.realFee,
				mints: [mint.mintUrl]
			})
		} catch (e) {
			handleError(e)
		}
	}
	const handleSwapProcess = async () => {
		// simple way
		try {
			const result = await autoMintSwap(mint.mintUrl, targetMint?.mintUrl || '', amount, estFee || 0)
			l({ swapResult: result })
			// TODO navigato to success screen
		} catch (e) {
			handleError(e)
		}
	}
	const handleSendingEcashProcess = async () => {
		try {
			const token = await sendToken(mint.mintUrl, amount, memo || '', proofs)
			// add as history entry
			await addToHistory({
				amount: -amount,
				type: 1,
				value: token,
				mints: [mint.mintUrl],
			})
			navigation.navigate('encodedToken', { token, amount })
		} catch (e) {
			navigation.navigate('processingError', {
				mint,
				amount,
				errorMsg: isErr(e) ? e.message : 'Something went wrong while creating the Cashu token.'
			})
		}
	}
	// start payment process
	useEffect(() => {
		if (isMelt) {
			void handleMeltingProcess()
			return
		}
		if (isSwap) {
			void handleSwapProcess()
			return
		}
		if (isSendEcash) {
			void handleSendingEcashProcess()
			return
		}
		void handleMintingProcess()
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isMelt, isSwap, isSendEcash])
	return (
		<View style={[globals(color).container, styles.container]}>
			<Loading size={40} />
			<Txt
				styles={[styles.descText]}
				txt={t(getProcessingtxt())}
			/>
			<Txt styles={[styles.hint, { color: color.TEXT_SECONDARY }]} txt={t('invoiceHint')} />
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		paddingTop: 0,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 20
	},
	descText: {
		marginTop: 20,
		textAlign: 'center',
	},
	hint: {
		fontSize: 14,
		marginTop: 10,
	}
})