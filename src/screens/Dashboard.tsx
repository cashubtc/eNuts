/* eslint-disable @typescript-eslint/no-misused-promises */
import Balance from '@comps/Balance'
import { IconBtn } from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import useCashuToken from '@comps/hooks/Token'
import { PlusIcon, ReceiveIcon, ScanQRIcon, SendIcon } from '@comps/Icons'
import OptsModal from '@comps/modal/OptsModal'
import { PromptModal } from '@comps/modal/Prompt'
import Txt from '@comps/Txt'
import { _testmintUrl, env } from '@consts'
import { addMint, getBalance, getMintsUrls, hasMints } from '@db'
import { l } from '@log'
import TrustMintModal from '@modal/TrustMint'
import type { TBeforeRemoveEvent, TDashboardPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { preventBack } from '@nav/utils'
import { useFocusClaimContext } from '@src/context/FocusClaim'
import { useInitialURL } from '@src/context/Linking'
import { useNostrContext } from '@src/context/Nostr'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { addToHistory } from '@store/latestHistoryEntries'
import { getDefaultMint } from '@store/mintStore'
import { highlight as hi, mainColors } from '@styles'
import { extractStrFromURL, getStrFromClipboard, hasTrustedMint, isCashuToken, isLnInvoice, isStr } from '@util'
import { claimToken, getMintsForPayment } from '@wallet'
import { getTokenInfo } from '@wallet/proofs'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function Dashboard({ navigation, route }: TDashboardPageProps) {
	const { t } = useTranslation([NS.common])
	// The URL content that redirects to this app after clicking on it (cashu:)
	const { url, clearUrl } = useInitialURL()
	// Theme
	const { color, highlight } = useThemeContext()
	// State to indicate token claim from clipboard after app comes to the foreground, to re-render total balance
	const { claimed } = useFocusClaimContext()
	// Nostr
	const { nutPub } = useNostrContext().nostr
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
		receiveOpts: false,
		sendOpts: false,
		resetNostr: false,
	})
	const { resetNostrData } = useNostrContext()

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

	// This function is only called if the mint of the received token is available as trusted in user DB
	const handleTokenSubmit = async (deepUrl: string) => {
		// clear deep link
		clearUrl()
		const tokenInfo = getTokenInfo(deepUrl)
		if (!tokenInfo) {
			openPromptAutoClose({ msg: t('clipboardInvalid') })
			closeOptsModal()
			stopLoading()
			return
		}
		// save token info in state
		setTokenInfo(tokenInfo)
		const defaultM = await getDefaultMint()
		// check if user wants to trust the token mint
		const userMints = await getMintsUrls()
		if (!hasTrustedMint(userMints, tokenInfo.mints) || (isStr(defaultM) && !tokenInfo.mints.includes(defaultM))) {
			closeOptsModal()
			// ask user for permission if token mint is not in his mint list
			const t = setTimeout(() => {
				setTrustModal(true)
				stopLoading()
				clearTimeout(t)
			}, 200)
			return
		}
		await receiveToken(deepUrl)
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

	// receive ecash button
	const handleClaimBtnPress = async () => {
		if (token.length) { return }
		startLoading()
		const clipboard = await getStrFromClipboard()
		l({ clipboard })
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
			const [userHasMints, nutPub, seenNostrIssue] = await Promise.all([
				hasMints(),
				store.get(STORE_KEYS.nutpub),
				store.get(STORE_KEYS.nostrReseted),
			])
			setHasMint(userHasMints)
			const t = setTimeout(() => {
				setModal(prev => ({
					...prev,
					resetNostr: isStr(nutPub) && nutPub.length > 0 && seenNostrIssue !== '1'
				}))
				clearTimeout(t)
			}, 1000)

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
			setModal(prev => ({ ...prev, mint: !userHasMints && explainerSeen !== '1' }))
			setBalance(balance)
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [claimed])

	// handle deep links
	useEffect(() => {
		if (!url) { return }
		const t = isCashuToken(url)
		if (t) {
			return void handleTokenSubmit(t)
		}
		if (isLnInvoice(url)) {
			navigation.navigate('processing', {
				mint: { mintUrl: '', customName: '' },
				amount: 0,
				isZap: true,
				recipient: extractStrFromURL(url) || url
			})
		}
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [navigation])

	// prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
	useEffect(() => {
		const backHandler = (e: TBeforeRemoveEvent) => preventBack(e, navigation.dispatch)
		navigation.addListener('beforeRemove', backHandler)
		return () => navigation.removeListener('beforeRemove', backHandler)
	}, [navigation])

	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			{/* Balance, Disclaimer & History */}
			<Balance balance={balance} nav={navigation} />
			{/* Receive/send/mints buttons */}
			<View style={[styles.actionWrap, { paddingHorizontal: s(20) }]}>
				{/* Send button or add first mint */}
				{hasMint ?
					<ActionBtn
						icon={<SendIcon width={s(32)} height={s(32)} color={hi[highlight]} />}
						txt={t('send', { ns: NS.wallet })}
						color={hi[highlight]}
						onPress={() => {
							// setModal(prev => ({ ...prev, sendOpts: true }))
							navigation.navigate('Recovering', {
								from: 500,
								to: 550,
								mintUrl: 'https://testnut.cashu.space',
								keysetId: 'asfdafh8u2h3',
								mnemonic: '',
								comingFromOnboarding: false,
							})
						}}
					/>
					:
					<ActionBtn
						icon={<PlusIcon width={s(36)} height={s(36)} color={hi[highlight]} />}
						txt={t('mint')}
						color={hi[highlight]}
						onPress={() => {
							navigation.navigate('mints')
							// navigation.navigate('Recovering', {
							// 	from: 500,
							// 	to: 550,
							// 	mintUrl: 'https://testnut.cashu.space',
							// 	keysetId: 'asfdafh8u2h3',
							// 	mnemonic: '',
							// 	comingFromOnboarding: false,
							// })
						}}
					/>
				}
				<ActionBtn
					icon={<ScanQRIcon width={s(32)} height={s(32)} color={hi[highlight]} />}
					txt={t('scan')}
					color={hi[highlight]}
					onPress={() => navigation.navigate('qr scan', { mint: undefined })}
				/>
				<ActionBtn
					icon={<ReceiveIcon width={s(32)} height={s(32)} color={hi[highlight]} />}
					txt={t('receive', { ns: NS.wallet })}
					color={hi[highlight]}
					onPress={() => {
						if (!hasMint) {
							// try to claim from clipboard to avoid receive-options-modal to popup and having to press again
							return handleClaimBtnPress()
						}
						setModal(prev => ({ ...prev, receiveOpts: true }))
					}}
				/>
			</View>
			{/* beta warning */}
			{(env.isExpoBeta || __DEV__) &&
				<View style={styles.hintWrap}>
					<TouchableOpacity
						onPress={() => navigation.navigate('disclaimer')}
						style={styles.betaHint}
					>
						<Txt txt='BETA' styles={[{ color: mainColors.WARN }]} />
					</TouchableOpacity>
				</View>
			}
			{/* Bottom nav icons */}
			<BottomNav
				navigation={navigation}
				route={route}
			/>
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
				button2Txt={t('createLnInvoice')}
				onPressSecondBtn={() => void handleMintBtnPress()}
				handleNostrReceive={() => {
					closeOptsModal()
					navigation.navigate('nostrReceive')
				}}
				onPressCancel={closeOptsModal}
				loading={loading}
			/>
			<PromptModal
				header={t('nostrIssueHeader')}
				txt={t('nostrIssueHint')}
				visible={modal.resetNostr}
				hideIcon
				submitTxt={t('submitNostrIssue')}
				submit={() => {
					setModal(prev => ({ ...prev, resetNostr: false }))
					void resetNostrData()
					void store.set(STORE_KEYS.nostrReseted, '1')
					openPromptAutoClose({ msg: t('nostrIssueSuccess'), success: true })
				}}
				close={() => {
					setModal(prev => ({ ...prev, resetNostr: false }))
					void store.set(STORE_KEYS.nostrReseted, '1')
				}}
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
				size={s(60)}
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

const styles = ScaledSheet.create({
	container: {
		flex: 1,
	},
	actionWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: '-30@s',
	},
	btnWrap: {
		alignItems: 'center',
		minWidth: '100@s'
	},
	btnTxt: {
		marginTop: '10@s',
	},
	hintWrap: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: '50@s',
	},
	betaHint: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: '20@s',
		paddingVertical: '10@s',
		borderWidth: 1,
		borderStyle: 'dashed',
		borderColor: mainColors.WARN,
		borderRadius: '50@s',
		minWidth: '120@s',
	}
})
