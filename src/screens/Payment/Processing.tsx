import { getDecodedLnInvoice } from '@cashu/cashu-ts'
import Loading from '@comps/Loading'
import Txt from '@comps/Txt'
import { _testmintUrl } from '@consts'
import { getMintBalance, getMintsBalances } from '@db'
import { l } from '@log'
import type { IMintUrl } from '@model'
import type { IDecodedLNInvoice } from '@model/ln'
import type { TBeforeRemoveEvent, TProcessingPageProps } from '@model/nav'
import { preventBack } from '@nav/utils'
import { pool } from '@nostr/class/Pool'
import { enutsPubkey, EventKind } from '@nostr/consts'
import { encrypt } from '@nostr/crypto'
import { getNostrUsername } from '@nostr/util'
import { useNostrContext } from '@src/context/Nostr'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { secureStore, store } from '@store'
import { SECRET, STORE_KEYS } from '@store/consts'
import { addLnPaymentToHistory } from '@store/HistoryStore'
import { addToHistory, updateLatestHistory } from '@store/latestHistoryEntries'
import { getCustomMintNames, getDefaultMint } from '@store/mintStore'
import { updateNostrDmUsers } from '@store/nostrDms'
import { cTo } from '@store/utils'
import { globals } from '@styles'
import { getInvoiceFromLnurl, isErr, isLnurl, uniqByIContacts } from '@util'
import { autoMintSwap, checkFees, payLnInvoice, requestMint, sendToken } from '@wallet'
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
	const { setRecent } = useNostrContext()
	const {
		mint,
		amount,
		memo,
		estFee,
		isMelt,
		isSendEcash,
		nostr,
		isSwap,
		isZap,
		payZap,
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
		if (isZap && !payZap) { return 'prepairZapData' }
		if (isMelt || (isZap && payZap)) { return 'processingPaymentByMint' }
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
			// l({ realFee: res.realFee })
			navigation.navigate('success', {
				amount,
				fee: res.realFee,
				isMelt: true,
				isZap
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
			const entry = await addToHistory({
				amount: -amount,
				type: 1,
				value: token,
				mints: [mint.mintUrl],
				recipient: getNostrUsername(nostr?.contact)
			})
			// https://github.com/nostr-protocol/nips/blob/master/04.md#security-warning
			if (nostr) {
				const sk = await secureStore.get(SECRET)
				const userNostrNpub = await store.get(STORE_KEYS.npub)
				if (!sk?.length || !nostr?.contact) {
					navigation.navigate(
						'processingError',
						getErrObj(mint, amount, t('createTokenErr', { ns: NS.common }))
					)
					return
				}
				const msg = `${userNostrNpub || nostr.senderName}  (sender not verified) just sent you ${amount} Sat in Ecash using ${enutsPubkey}!\n\n ${token}`
				const cipherTxt = encrypt(sk, nostr.contact.hex, msg)
				const event = {
					kind: EventKind.DirectMessage,
					tags: [['p', nostr.contact.hex]],
					content: cipherTxt,
					created_at: Math.ceil(Date.now() / 1000),
				}
				const userRelays = await store.get(STORE_KEYS.relays)
				// TODO publish the event to the RECIPIENT relays AND our relays.
				const published = await pool.publishEventToPool(event, sk, cTo<string[]>(userRelays || '[]'))
				if (!published) {
					l('Something went wrong while publishing the event.')
					navigation.navigate(
						'processingError',
						getErrObj(mint, amount, t('eventError', { ns: NS.common }))
					)
					return
				}
				// save recipient hex to get the conversation later on
				await updateNostrDmUsers(nostr.contact)
				setRecent(prev => {
					if (!nostr.contact) { return prev }
					return uniqByIContacts([...prev, nostr.contact], 'hex')
				})
				navigation.navigate('success', { amount, nostr })
				return
			}
			navigation.navigate('encodedToken', { entry })
		} catch (e) {
			navigation.navigate(
				'processingError',
				getErrObj(mint, amount, t('createTokenErr', { ns: NS.common }), e)
			)
		}
	}

	const handleZapProcess = async () => {
		if (!recipient) {
			return navigation.navigate('processingError', {
				mint,
				amount,
				errorMsg: ''
			})
		}
		try {
			const decoded: IDecodedLNInvoice = getDecodedLnInvoice(recipient)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
			const amount = decoded.sections[2].value / 1000
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
			const timePassed = Math.ceil(Date.now() / 1000) - decoded.sections[4].value
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
			const timeLeft = decoded.sections[8].value - timePassed
			if (timeLeft <= 0) {
				return navigation.navigate('processingError', {
					mint,
					amount,
					errorMsg: t('invoiceExpired', { ns: NS.common })
				})
			}
			// user has default mint, check default mint balance
			const defaultMint = await getDefaultMint()
			if (defaultMint) {
				const defaultBalance = await getMintBalance(defaultMint)
				const estFee = await checkFees(defaultMint, recipient)
				// if default mint balance + estFee is sufficient, use it
				if (defaultBalance + estFee >= amount) {
					return navigation.navigate('coinSelection', {
						mint: { mintUrl: defaultMint, customName: '' },
						balance: defaultBalance,
						amount: +amount,
						estFee,
						isZap,
						recipient
					})
				}
			}
			// otherwise, check mint with highest balance
			const mintsBals = await getMintsBalances()
			const mints = await getCustomMintNames(mintsBals.map(m => ({ mintUrl: m.mintUrl })))
			const highestBalance = Math.max(...mintsBals.map(m => m.amount))
			const highestBalanceMint = mintsBals.find(m => m.amount === highestBalance)
			// if highest balance + estFee is sufficient, use it
			if (highestBalanceMint) {
				const estFee = await checkFees(highestBalanceMint.mintUrl, recipient)
				if (highestBalance + estFee >= amount) {
					return navigation.navigate('coinSelection', {
						mint: mints.find(m => m.mintUrl === highestBalanceMint.mintUrl) || { mintUrl: 'N/A', customName: 'N/A' },
						balance: highestBalanceMint.amount,
						amount: +amount,
						estFee,
						isZap,
						recipient
					})
				}
			}
			// otherwise, check if any other mint has sufficient balance
			const otherMints = mintsBals.filter(m => m.mintUrl !== _testmintUrl && m.amount > amount)
			// show error if no other mint has sufficient balance
			if (!otherMints.length) {
				return navigation.navigate('processingError', {
					mint,
					amount,
					errorMsg: t('noFunds', { ns: NS.common })
				})
			}
			const mintToUse = otherMints[0]
			const estFee = await checkFees(mintToUse.mintUrl, recipient)
			// if other mint + estFee is sufficient, use it
			if (mintToUse.amount + estFee >= amount) {
				return navigation.navigate('coinSelection', {
					mint: mints.find(m => m.mintUrl === mintToUse.mintUrl) || { mintUrl: 'N/A', customName: 'N/A' },
					balance: mintToUse.amount,
					amount: +amount,
					estFee,
					isZap,
					recipient
				})
			}
		} catch (e) {
			return handleError({ e })
		}
		// otherwise, show error
		navigation.navigate('processingError', {
			mint,
			amount,
			errorMsg: t('noFunds', { ns: NS.common })
		})
	}

	// start payment process
	useEffect(() => {
		if (isZap) {
			if (payZap) {
				return void handleMeltingProcess()
			}
			return void handleZapProcess()
		}
		if (isMelt) {
			return void handleMeltingProcess()
		}
		if (isSwap) {
			return void handleSwapProcess()
		}
		if (isSendEcash) {
			return void handleSendingEcashProcess()
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