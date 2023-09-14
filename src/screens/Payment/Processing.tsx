import { getDecodedLnInvoice } from '@cashu/cashu-ts'
import Loading from '@comps/Loading'
import Txt from '@comps/Txt'
import { _testmintUrl } from '@consts'
import { l } from '@log'
import type { IMintUrl } from '@model'
import type { TBeforeRemoveEvent, TProcessingPageProps } from '@model/nav'
import { preventBack } from '@nav/utils'
import { relay } from '@nostr/class/Relay'
import { enutsPubkey, EventKind } from '@nostr/consts'
import { encrypt } from '@nostr/crypto'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { updateNostrDmUsers } from '@src/storage/store/nostrDms'
import { cTo } from '@src/storage/store/utils'
import { secureStore, store } from '@store'
import { SECRET, STORE_KEYS } from '@store/consts'
import { addLnPaymentToHistory } from '@store/HistoryStore'
import { addToHistory, updateLatestHistory } from '@store/latestHistoryEntries'
import { globals } from '@styles'
import { formatMintUrl, getInvoiceFromLnurl, isErr, isLnurl } from '@util'
import { autoMintSwap, payLnInvoice, requestMint, requestToken, sendToken } from '@wallet'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

interface IErrorProps {
	e?: unknown
	customMsg?: 'requestMintErr' | 'generalMeltingErr' | 'invoiceFromLnurlError'
}

export default function ProcessingScreen({ navigation, route }: TProcessingPageProps) {
	const { t } = useTranslation([NS.mints])
	const { color } = useThemeContext()
	const {
		mint,
		amount,
		memo,
		estFee,
		isMelt,
		isSendEcash,
		nostr,
		isSwap,
		targetMint,
		proofs,
		recipient
	} = route.params

	const handleError = ({ e, customMsg }: IErrorProps) => {
		const translatedErrMsg = t(customMsg || 'requestMintErr', { ns: NS.error })
		navigation.navigate('processingError', {
			amount,
			mint,
			errorMsg: isErr(e) ? e.message : translatedErrMsg
		})
	}

	const getErrObj = (mint: IMintUrl, amount: number, fallbackMsg: string, e?: unknown) => ({
		mint,
		amount,
		errorMsg: isErr(e) ? e.message : fallbackMsg
	})

	const getProcessingtxt = () => {
		if (isMelt) { return 'processingPaymentByMint' }
		if (isSwap) { return 'processingSwap' }
		if (isSendEcash) {
			if (nostr) {
				return 'sendingEcashViaNostr'
			}
			return 'creatingEcashToken'
		}
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
					handleError({})
					return
				}
				// add as history entry (receive ecash via lightning)
				await addToHistory({
					amount,
					type: 2,
					value: invoice?.pr || '',
					mints: [mint.mintUrl],
				})
				navigation.navigate('success', { amount, mint: mint.customName || formatMintUrl(mint.mintUrl) })
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
			handleError({ e })
		}
	}

	const handleMeltingProcess = async () => {
		let invoice = ''
		// recipient can be a LNURL or a LN invoice
		if (recipient?.length && isLnurl(recipient)) {
			try {
				invoice = await getInvoiceFromLnurl(recipient, +amount)
				if (!invoice?.length) {
					handleError({ customMsg: 'invoiceFromLnurlError' })
					return
				}
			} catch (e) {
				handleError({ e })
				return
			}
		}
		try {
			const target = invoice || recipient || ''
			const res = await payLnInvoice(mint.mintUrl, target, estFee || 0, proofs || [])
			if (!res?.result?.isPaid) {
				// here it could be a routing path finding issue
				handleError({ e: isErr(res.error) ? res.error : undefined })
				return
			}
			// payment success, add as history entry
			await addLnPaymentToHistory(
				res,
				[mint.mintUrl],
				-amount - (res?.realFee ?? 0),
				target
			)
			// update latest 3 history entries
			await updateLatestHistory({
				amount: -amount - (res?.realFee ?? 0),
				fee: res.realFee,
				type: 2,
				value: target,
				mints: [mint.mintUrl],
				timestamp: Math.ceil(Date.now() / 1000)
			})
			navigation.navigate('success', {
				amount,
				fee: res.realFee,
				isMelt: true
			})
		} catch (e) {
			handleError({ e })
		}
	}

	const handleSwapProcess = async () => {
		if (!targetMint?.mintUrl?.trim()) { return handleError({ e: `targetMint: ${targetMint?.mintUrl} is invalid` }) }
		// simple way
		try {
			const res = await autoMintSwap(mint.mintUrl, targetMint.mintUrl, amount, estFee ?? 0)
			// add as history entry (multimint swap)
			await addToHistory({
				amount: -amount - (res?.payResult?.realFee ?? 0),
				fee: res.payResult.realFee,
				type: 3,
				value: res.requestTokenResult.invoice?.pr || '',
				mints: [mint.mintUrl],
				recipient: targetMint?.mintUrl || ''
			})
			navigation.navigate('success', {
				amount,
				fee: res.payResult.realFee,
				isMelt: true
			})
		} catch (e) {
			handleError({ e })
		}
	}

	const handleSendingEcashProcess = async () => {
		try {
			const token = await sendToken(mint.mintUrl, amount, memo || '', proofs)
			// add as history entry (send ecash)
			await addToHistory({
				amount: -amount,
				type: 1,
				value: token,
				mints: [mint.mintUrl],
				recipient: nostr?.receiverName || ''
			})
			// https://github.com/nostr-protocol/nips/blob/master/04.md#security-warning
			if (nostr) {
				const sk = await secureStore.get(SECRET)
				const userNostrNpub = await store.get(STORE_KEYS.npub)
				if (!sk?.length) {
					navigation.navigate(
						'processingError',
						getErrObj(mint, amount, t('createTokenErr', { ns: NS.common }))
					)
					return
				}
				const msg = `${userNostrNpub || nostr.senderName}  (sender not verified) just sent you ${amount} Sat in Ecash using ${enutsPubkey}!\n\n ${token}`
				const cipherTxt = await encrypt(sk, nostr.receiverNpub, msg)
				const event = {
					kind: EventKind.DirectMessage,
					tags: [['p', nostr.receiverNpub]],
					content: cipherTxt,
					created_at: Math.ceil(Date.now() / 1000),
				}
				const userRelays = await store.get(STORE_KEYS.relays)
				// TODO publish the event to the RECIPIENT relays AND our relays.
				const published = await relay.publishEventToPool(event, sk, cTo<string[]>(userRelays || '[]'))
				if (!published) {
					l('Something went wrong while publishing the event.')
					navigation.navigate(
						'processingError',
						getErrObj(mint, amount, t('eventError', { ns: NS.common }))
					)
					return
				}
				// save receipient pubkey to get the conversation later on
				await updateNostrDmUsers(nostr.receiverNpub)
				navigation.navigate('success', { amount, nostr })
				return
			}
			navigation.navigate('encodedToken', { token, amount })
		} catch (e) {
			navigation.navigate(
				'processingError',
				getErrObj(mint, amount, t('createTokenErr', { ns: NS.common }), e)
			)
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

	// prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
	useEffect(() => {
		const backHandler = (e: TBeforeRemoveEvent) => preventBack(e, navigation.dispatch)
		navigation.addListener('beforeRemove', backHandler)
		return () => navigation.removeListener('beforeRemove', backHandler)
	}, [navigation])

	return (
		<View style={[globals(color).container, styles.container]}>
			<Loading size={40} nostr={!!nostr} />
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