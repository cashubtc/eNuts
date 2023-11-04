/* eslint-disable @typescript-eslint/no-misused-promises */
import Balance from '@comps/Balance'
import { IconBtn } from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import useCashuToken from '@comps/hooks/Token'
import { AboutIcon, ChevronRightIcon, PlusIcon, ReceiveIcon, ScanQRIcon, SendIcon } from '@comps/Icons'
import InitialModal from '@comps/InitialModal'
import Txt from '@comps/Txt'
import { _testmintUrl } from '@consts'
import { addMint, getBalance, getMintsBalances, getMintsUrls, hasMints } from '@db'
import { l } from '@log'
import OptsModal from '@modal/OptsModal'
import TrustMintModal from '@modal/TrustMint'
import type { TDashboardPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { useFocusClaimContext } from '@src/context/FocusClaim'
import { useInitialURL } from '@src/context/Linking'
import { useNostrContext } from '@src/context/Nostr'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { addToHistory } from '@store/latestHistoryEntries'
import { getCustomMintNames, saveDefaultOnInit } from '@store/mintStore'
import { highlight as hi, mainColors } from '@styles'
import { getStrFromClipboard, hasTrustedMint, isCashuToken, isErr } from '@util'
import { claimToken } from '@wallet'
import { getTokenInfo } from '@wallet/proofs'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackHandler, StyleSheet, TouchableOpacity, View } from 'react-native'

export default function Dashboard({ navigation, route }: TDashboardPageProps) {
	const { t } = useTranslation([NS.common])
	// The URL content that redirects to this app after clicking on it (cashu:)
	const { url } = useInitialURL()
	// Theme
	const { color, highlight } = useThemeContext()
	// State to indicate token claim from clipboard after app comes to the foreground, to re-render total balance
	const { claimed } = useFocusClaimContext()
	// Nostr
	const { nutPub } = useNostrContext()
	const { loading, startLoading, stopLoading } = useLoading()
	// Prompt modal
	const { openPromptAutoClose } = usePromptContext()
	// Cashu token hook
	const {
		token,
		setToken,
		tokenInfo,
		setTokenInfo,
		trustModal,
		setTrustModal
	} = useCashuToken()
	// Total Balance state (all mints)
	const [balance, setBalance] = useState(0)
	const [hasMint, setHasMint] = useState(false)
	// modals
	const [modal, setModal] = useState({
		mint: false,
		receiveOpts: false,
		sendOpts: false
	})

	// This function is only called if the mints of the received token are not in the user DB
	const handleTrustModal = async () => {
		if (loading) { return }
		startLoading()
		if (!tokenInfo) {
			openPromptAutoClose({ msg: t('clipboardInvalid') })
			closeOptsModal()
			stopLoading()
			return
		}
		for (const mint of tokenInfo.mints) {
			// eslint-disable-next-line no-await-in-loop
			await addMint(mint)
		}
		// add token to db
		await receiveToken(token)
	}

	// navigates to the mint list page
	const handleMintModal = async (forEnutsMint = false) => {
		setModal({ ...modal, mint: false })
		await store.set(STORE_KEYS.explainer, '1')
		navigation.navigate('mints', { defaultMint: forEnutsMint, newMint: !forEnutsMint })
	}

	const handleEnutsMint = async () => {
		try {
			await saveDefaultOnInit()
		} catch (e) {
			// TODO update error message: Mint could not be added, please add a different one or try again later.
			openPromptAutoClose({ msg: isErr(e) ? e.message : t('smthWrong') })
			await handleMintModal(false)
			return
		}
		await handleMintModal(true)
	}

	// This function is only called if the mint of the received token is available as trusted in user DB
	const handleTokenSubmit = async (url: string) => {
		const tokenInfo = getTokenInfo(url)
		if (!tokenInfo) {
			openPromptAutoClose({ msg: t('clipboardInvalid') })
			closeOptsModal()
			stopLoading()
			return
		}
		// save token info in state
		setTokenInfo(tokenInfo)
		// check if user wants to trust the token mint
		const userMints = await getMintsUrls()
		if (!hasTrustedMint(userMints, tokenInfo.mints)) {
			closeOptsModal()
			// ask user for permission if token mint is not in his mint list
			const t = setTimeout(() => {
				setTrustModal(true)
				stopLoading()
				clearTimeout(t)
			}, 200)
			return
		}
		await receiveToken(url)
	}

	// helper function that gets called either right after pasting token or in the trust modal depending on user permission
	const receiveToken = async (encodedToken: string) => {
		const success = await claimToken(encodedToken).catch(l)
		closeOptsModal()
		setToken('')
		stopLoading()
		if (!success) {
			setTrustModal(false)
			openPromptAutoClose({ msg: t('invalidOrSpent') })
			return
		}
		const info = getTokenInfo(encodedToken)
		if (!info) {
			setTrustModal(false)
			openPromptAutoClose({ msg: t('tokenInfoErr') })
			return
		}
		// add as history entry (receive ecash)
		await addToHistory({
			amount: info.value,
			type: 1,
			value: encodedToken,
			mints: info.mints,
		})
		setTrustModal(false)
		navigation.navigate('success', {
			amount: info?.value,
			memo: info?.decoded.memo,
			isClaim: true
		})
	}

	// get mints for send/receive process
	const getMintsForPayment = async () => {
		const mintsBals = await getMintsBalances()
		const mints = await getCustomMintNames(mintsBals.map(m => ({ mintUrl: m.mintUrl })))
		return { mintsBals, mints }
	}

	// receive ecash button
	const handleClaimBtnPress = async () => {
		if (token.length) { return }
		startLoading()
		const clipboard = await getStrFromClipboard()
		if (!clipboard?.length || !isCashuToken(clipboard)) {
			openPromptAutoClose({ msg: t('invalidOrSpent') })
			closeOptsModal()
			stopLoading()
			return
		}
		setToken(clipboard)
		await handleTokenSubmit(clipboard)
	}

	// mint new token
	const handleMintBtnPress = async () => {
		const { mintsBals, mints } = await getMintsForPayment()
		closeOptsModal()
		// user has only 1 mint so he can skip selectMint screen
		if (mints.length === 1 && mintsBals.length === 1) {
			navigation.navigate('selectAmount', {
				mint: mints[0],
				balance: mintsBals[0].amount
			})
			return
		}
		// user has more than 1 mint so he has to choose the one he wants to communicate to
		navigation.navigate('selectMint', {
			mints,
			mintsWithBal: mintsBals,
		})
	}

	// send token or melt ecash
	const handleSendBtnPress = async ({ isMelt, isSendEcash }: { isMelt?: boolean, isSendEcash?: boolean }) => {
		const { mintsBals, mints } = await getMintsForPayment()
		closeOptsModal()
		const nonEmptyMints = mintsBals.filter(m => m.amount > 0)
		// user has only 1 mint with balance, he can skip the mint selection
		if (nonEmptyMints.length === 1) {
			// user has no nostr contacts so he can directly navigate to amount selection
			if (!nutPub.length && isSendEcash) {
				navigation.navigate('selectAmount', {
					mint: mints.find(m => m.mintUrl === nonEmptyMints[0].mintUrl) || { mintUrl: 'N/A', customName: 'N/A' },
					balance: nonEmptyMints[0].amount,
					isSendEcash,
				})
				return
			}
			// otherwise he can select his contacts as target, get remaining mints for a possible multimint swap
			const remainingMints = mints.filter(m => m.mintUrl !== _testmintUrl)
			navigation.navigate('selectTarget', {
				mint: mints.find(m => m.mintUrl === nonEmptyMints[0].mintUrl) || { mintUrl: 'N/A', customName: 'N/A' },
				balance: nonEmptyMints[0].amount,
				isMelt,
				isSendEcash,
				remainingMints
			})
			return
		}
		// user has more than 1 mint so he has to choose the one he wants to communicate to
		navigation.navigate('selectMint', {
			mints,
			mintsWithBal: mintsBals,
			allMintsEmpty: !nonEmptyMints.length,
			isMelt,
			isSendEcash
		})
	}

	// close send/receive options modal
	const closeOptsModal = () => setModal(prev => ({ ...prev, receiveOpts: false, sendOpts: false }))

	useEffect(() => {
		void (async () => {
			setHasMint(await hasMints())
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// check for available mints of the user
	useEffect(() => {
		void (async () => {
			const [userHasMints, explainerSeen, balance] = await Promise.all([
				hasMints(),
				store.get(STORE_KEYS.explainer),
				getBalance(),
			])
			setHasMint(userHasMints)
			setModal({ ...modal, mint: !userHasMints && explainerSeen !== '1' })
			setBalance(balance)
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [claimed])

	// handle initial URL passed on by clicking on a cashu link
	useEffect(() => {
		void (async () => {
			if (!url) { return }
			// alert(`URL in dashboard useEffect: ${url}`)
			await handleTokenSubmit(url)
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [url])

	// get balance after navigating to this page
	useEffect(() => {
		const focusHandler = navigation.addListener('focus', async () => {
			const data = await Promise.all([
				getBalance(),
				hasMints()
			])
			setBalance(data[0])
			setHasMint(data[1])
		})
		return focusHandler
	}, [navigation])

	// prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
	useEffect(() => {
		const backHandler = () => BackHandler.exitApp()
		navigation.addListener('beforeRemove', backHandler)
		return () => navigation.removeListener('beforeRemove', backHandler)
	}, [navigation])

	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			{/* Balance, Disclaimer & History */}
			<Balance balance={balance} nav={navigation} />
			{/* Receive/send/mints buttons */}
			<View style={[styles.actionWrap, { paddingHorizontal: 30 }]}>
				{/* Send button or add first mint */}
				{hasMint ?
					<ActionBtn
						icon={<SendIcon width={32} height={32} color={hi[highlight]} />}
						txt={t('send', { ns: NS.wallet })}
						color={hi[highlight]}
						onPress={() => setModal({ ...modal, sendOpts: true })}
					/>
					:
					<ActionBtn
						icon={<PlusIcon width={36} height={36} color={hi[highlight]} />}
						txt='Mint'
						color={hi[highlight]}
						onPress={() => setModal({ ...modal, mint: true })}
					/>
				}
				<ActionBtn
					icon={<ScanQRIcon width={32} height={32} color={hi[highlight]} />}
					txt={t('scan')}
					color={hi[highlight]}
					onPress={() => navigation.navigate('qr scan', { mint: undefined })}
				/>
				<ActionBtn
					icon={<ReceiveIcon width={32} height={32} color={hi[highlight]} />}
					txt={t('receive', { ns: NS.wallet })}
					color={hi[highlight]}
					onPress={() => {
						if (!hasMint) {
							// try to claim from clipboard to avoid receive-options-modal to popup and having to press again
							void handleClaimBtnPress()
							return
						}
						setModal({ ...modal, receiveOpts: true })
					}}
				/>
			</View>
			{/* beta warning */}
			<View style={styles.hintWrap}>
				<TouchableOpacity
					onPress={() => navigation.navigate('disclaimer')}
					style={styles.betaHint}
				>
					<AboutIcon color={mainColors.WARN} />
					<Txt txt={t('enutsBeta')} styles={[{ color: mainColors.WARN, marginHorizontal: 10 }]} />
					<ChevronRightIcon color={mainColors.WARN} />
				</TouchableOpacity>
			</View>
			{/* Bottom nav icons */}
			<BottomNav navigation={navigation} route={route} />
			{/* Question modal for mint trusting */}
			{trustModal &&
				<TrustMintModal
					loading={loading}
					tokenInfo={tokenInfo}
					handleTrustModal={() => void handleTrustModal()}
					closeModal={() => {
						setTrustModal(false)
						setToken('')
					}}
				/>
			}
			{/* Initial mint modal prompt */}
			<InitialModal
				visible={modal.mint}
				onConfirm={() => void handleEnutsMint()}
				onCancel={() => void handleMintModal()}
			/>
			{/* Send options */}
			<OptsModal
				visible={modal.sendOpts}
				button1Txt={t('sendEcash')}
				onPressFirstBtn={() => void handleSendBtnPress({ isSendEcash: true })}
				button2Txt={t('payLNInvoice', { ns: NS.wallet })}
				onPressSecondBtn={() => void handleSendBtnPress({ isMelt: true })}
				onPressCancel={closeOptsModal}
				isSend
			/>
			{/* Receive options */}
			<OptsModal
				visible={modal.receiveOpts}
				button1Txt={loading ? t('claiming', { ns: NS.wallet }) : t('pasteToken', { ns: NS.wallet })}
				onPressFirstBtn={() => void handleClaimBtnPress()}
				button2Txt={t('mintNewTokens', { ns: NS.mints })}
				onPressSecondBtn={() => void handleMintBtnPress()}
				handleNostrReceive={() => {
					closeOptsModal()
					navigation.navigate('nostrReceive')
				}}
				onPressCancel={closeOptsModal}
				loading={loading}
			/>
		</View>
	)
}

interface IActionBtnsProps {
	icon: React.ReactNode
	txt: string
	onPress: () => void
	color: string
	disabled?: boolean
}

function ActionBtn({ icon, onPress, txt, color, disabled }: IActionBtnsProps) {
	return (
		<View style={styles.btnWrap}>
			<IconBtn
				icon={icon}
				size={70}
				outlined
				onPress={onPress}
				disabled={disabled}
			/>
			<Txt
				txt={txt}
				bold
				styles={[styles.btnTxt, { color, opacity: disabled ? .5 : 1 }]}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	actionWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: -35,
	},
	btnWrap: {
		alignItems: 'center',
		minWidth: 100
	},
	btnTxt: {
		marginTop: 10,
	},
	hintWrap: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 50,
	},
	betaHint: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 10,
		borderWidth: 1,
		borderStyle: 'dashed',
		borderColor: mainColors.WARN,
		borderRadius: 50,
	}
})
