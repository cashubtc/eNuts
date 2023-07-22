/* eslint-disable @typescript-eslint/no-misused-promises */
import ActionButtons from '@comps/ActionButtons'
import Balance from '@comps/Balance'
import useLoading from '@comps/hooks/Loading'
import usePrompt from '@comps/hooks/Prompt'
import useCashuToken from '@comps/hooks/Token'
import InitialModal from '@comps/InitialModal'
import Toaster from '@comps/Toaster'
import { addMint, getBalance, getMintsBalances, getMintsUrls, hasMints } from '@db'
import { l } from '@log'
import OptsModal from '@modal/OptsModal'
import TrustMintModal from '@modal/TrustMint'
import type { TDashboardPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { FocusClaimCtx } from '@src/context/FocusClaim'
import { useInitialURL } from '@src/context/Linking'
import { ThemeContext } from '@src/context/Theme'
import { getCustomMintNames } from '@src/storage/store/mintStore'
import { store } from '@store'
import { addToHistory } from '@store/HistoryStore'
import { hasTrustedMint, isCashuToken } from '@util'
import { claimToken } from '@wallet'
import { getTokenInfo } from '@wallet/proofs'
import * as Clipboard from 'expo-clipboard'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, StyleSheet, View } from 'react-native'

export default function Dashboard({ navigation, route }: TDashboardPageProps) {
	const { t } = useTranslation(['common'])
	// The URL content that redirects to this app after clicking on it (cashu:)
	const { url } = useInitialURL()
	// Theme
	const { color } = useContext(ThemeContext)
	// State to indicate token claim from clipboard after app comes to the foreground, to re-render total balance
	const { claimed } = useContext(FocusClaimCtx)
	// Total Balance state (all mints)
	const [balance, setBalance] = useState(0)
	// Prompt modal
	const { prompt, openPromptAutoClose } = usePrompt()
	// Cashu token hook
	const {
		token,
		setToken,
		tokenInfo,
		setTokenInfo,
		trustModal,
		setTrustModal
	} = useCashuToken()
	const { loading, startLoading, stopLoading } = useLoading()
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
		// TODO Maybe we should provide the user the possibility to choose mints
		// in the trust modal-question once multiple mints per token are available...
		if (!tokenInfo) {
			openPromptAutoClose({ msg: t('clipboardInvalid') })
			setModal({ ...modal, receiveOpts: false })
			stopLoading()
			return
		}
		// TODO only add chosen mints by the user
		for (const mint of tokenInfo.mints) {
			// eslint-disable-next-line no-await-in-loop
			await addMint(mint)
		}
		// add token to db
		await receiveToken(token)
	}
	// navigates to the mint list page
	const handleMintModal = () => {
		setModal({ ...modal, mint: false })
		navigation.navigate('mints')
	}
	// This function is only called if the mint of the received token is available as trusted in user DB
	const handleTokenSubmit = async (url: string) => {
		const tokenInfo = getTokenInfo(url)
		if (!tokenInfo) {
			openPromptAutoClose({ msg: t('clipboardInvalid') })
			setModal({ ...modal, receiveOpts: false })
			stopLoading()
			return
		}
		// save token info in state
		setTokenInfo(tokenInfo)
		// check if user wants to trust the token mint
		const userMints = await getMintsUrls()
		// TODO update this check for future multiple mints of token
		if (!hasTrustedMint(userMints, tokenInfo.mints)) {
			// ask user for permission if token mint is not in his mint list
			setTrustModal(true)
			stopLoading()
			return
		}
		await receiveToken(url)
	}
	// helper function that gets called either right after submitting input or in the trust modal depending on user permission
	const receiveToken = async (encodedToken: string) => {
		const success = await claimToken(encodedToken).catch(l)
		setTrustModal(false)
		setModal({ ...modal, receiveOpts: false })
		setToken('')
		stopLoading()
		if (!success) {
			openPromptAutoClose({ msg: t('invalidOrSpent') })
			return
		}
		const info = getTokenInfo(encodedToken)
		if (!info) {
			openPromptAutoClose({ msg: t('tokenInfoErr') })
			return
		}
		// add as history entry
		await addToHistory({
			amount: info.value,
			type: 1,
			value: encodedToken,
			mints: info.mints,
		})
		navigation.navigate('success', {
			amount: info?.value,
			mints: info?.mints,
			memo: info?.decoded.memo
		})
	}
	// receive ecash button
	const handleClaimBtnPress = async () => {
		if (token.length) { return }
		startLoading()
		const clipboard = await Clipboard.getStringAsync()
		if (!isCashuToken(clipboard)) {
			openPromptAutoClose({ msg: t('invalidOrSpent') })
			closeOptsModal()
			stopLoading()
			return
		}
		setToken(clipboard)
		await handleTokenSubmit(clipboard)
	}
	// send ecash button
	const handleSendBtnPress = () => {
		navigation.navigate('send')
		closeOptsModal()
	}
	// mint/melt button
	const handleLnBtnPress = async (isMelt: boolean) => {
		const mintsWithBal = await getMintsBalances()
		if (!mintsWithBal.length) {
			// TODO prompt user
			return
		}
		const mintsWithName = await getCustomMintNames(mintsWithBal.map(m => ({ mintUrl: m.mintUrl })))
		closeOptsModal()
		// user has only 1 mint with balance, he can skip the mint selection
		if (mintsWithBal.filter(m => m.amount > 0).length === 1) {
			navigation.navigate('selectAmount', { mint: mintsWithName[0] })
			return
		}
		navigation.navigate('selectMint', { isMelt })
	}
	// close send/receive options modal
	const closeOptsModal = () => setModal({ ...modal, receiveOpts: false, sendOpts: false })
	// check for available mints of the user
	useEffect(() => {
		void (async () => {
			const hasUserMints = await hasMints()
			const skippedInitialMint = await store.get('init_mintSkipped')
			setModal({ ...modal, mint: !hasUserMints && skippedInitialMint !== '1' })
			setBalance(await getBalance())
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
			setBalance(await getBalance())
		})
		return focusHandler
	}, [navigation])

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav nav={{ navigation, route }} />
			{/* Balance, Disclaimer & History */}
			<Balance balance={balance} nav={navigation} />
			{/* Flex space-between empty placeholder */}
			<View />
			{/* Receive and send buttons */}
			<ActionButtons
				ontopOfNav
				topBtnTxt={t('receive', { ns: 'wallet' })}
				topBtnAction={() => setModal({ ...modal, receiveOpts: true })}
				bottomBtnTxt={t('send', { ns: 'wallet' })}
				bottomBtnAction={() => setModal({ ...modal, sendOpts: true })}
				withHistory
				nav={navigation}
			/>
			{/* Bottom nav icons */}
			<BottomNav navigation={navigation} route={route} />
			{/* Question modal for mint trusting */}
			{trustModal &&
				<TrustMintModal
					loading={loading}
					tokenInfo={tokenInfo}
					handleTrustModal={handleTrustModal}
					closeModal={() => setTrustModal(false)}
				/>
			}
			{/* Initial mint modal prompt */}
			<InitialModal
				visible={modal.mint}
				onConfirm={handleMintModal}
				onCancel={async () => {
					await store.set('init_mintSkipped', '1')
					setModal({ ...modal, mint: false })
				}}
			/>
			{/* Receive options */}
			<OptsModal
				visible={modal.receiveOpts}
				button1Txt={loading ? t('claiming', { ns: 'wallet' }) : t('pasteToken', { ns: 'wallet' })}
				onPressFirstBtn={() => void handleClaimBtnPress()}
				button2Txt={t('createInvoice', { ns: 'wallet' })}
				onPressSecondBtn={() => void handleLnBtnPress(false)}
				onPressCancel={closeOptsModal}
			/>
			{/* Send options */}
			<OptsModal
				visible={modal.sendOpts}
				button1Txt={t('sendEcash', { ns: 'wallet' })}
				onPressFirstBtn={handleSendBtnPress}
				button2Txt={t('payLNInvoice', { ns: 'wallet' })}
				onPressSecondBtn={() => void handleLnBtnPress(true)}
				onPressCancel={closeOptsModal}
			/>
			{/* Prompt toaster */}
			{prompt.open && <Toaster success={prompt.success} txt={prompt.msg} />}
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
	},
	pasteInputTxt: {
		fontSize: 16,
		fontWeight: '500',
	},
})
