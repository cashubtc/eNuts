import Button from '@comps/Button'
import Empty from '@comps/Empty'
import useLoading from '@comps/hooks/Loading'
import { ZapIcon } from '@comps/Icons'
import LNInvoiceAmountModal from '@comps/InvoiceAmount'
import Txt from '@comps/Txt'
import { getProofsByMintUrl } from '@db'
import { l } from '@log'
import { PromptModal } from '@modal/Prompt'
import type { IMintUrl, IProofSelection } from '@model'
import type { TLightningPageProps, TSendTokenPageProps } from '@model/nav'
import { CoinSelectionModal, CoinSelectionResume } from '@screens/Lightning/modal'
import { useKeyboard } from '@src/context/Keyboard'
import { ThemeContext } from '@src/context/Theme'
import { addToHistory } from '@store/HistoryStore'
import { globals, highlight as hi } from '@styles'
import { cleanUpNumericStr, formatInt, getSelectedAmount, isErr, isNum } from '@util'
import { sendToken } from '@wallet'
import { useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native'

import MintPanel from './mintPanel'

interface ILNPageProps {
	nav: TLightningPageProps | TSendTokenPageProps
	mints: IMintUrl[]
	selectedMint?: IMintUrl
	mintBal: number
	setSelectedMint: (url: IMintUrl) => void
	isSendingToken?: boolean
}

export default function LNPageContent({
	nav,
	mints,
	selectedMint,
	mintBal,
	setSelectedMint,
	isSendingToken
}: ILNPageProps) {
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const { isKeyboardOpen } = useKeyboard()
	// invoice amount modal
	const [lnAmountModal, setLNAmountModal] = useState(false)
	const setLnAmountModalCB = useCallback((val: boolean) => setLNAmountModal(val), [])
	// spendable token amount state
	const [amount, setAmount] = useState('')
	// spendable token memo state
	const [memo, setMemo] = useState('')
	// coin selection
	const [isEnabled, setIsEnabled] = useState(false)
	const toggleSwitch = () => setIsEnabled(prev => !prev)
	const [proofs, setProofs] = useState<IProofSelection[]>([])
	// LN payment error
	const [payError, setPayError] = useState({
		open: false,
		msg: ''
	})
	const { loading, startLoading, stopLoading } = useLoading()
	const hasEnoughFunds = () => {
		// is coming from the send token page or from send via lightning page
		if (mintBal < 1 && (isSendingToken || nav.route.params?.send)) { return false }
		// is coming from send via lightning page
		if (nav.route.params?.send && isNum(nav.route.params?.balance) && nav.route.params.balance === 0) {
			return false
		}
		return true
	}
	// generate spendable token
	const generateToken = async () => {
		startLoading()
		// coin selection
		const selectedProofs = proofs.filter(p => p.selected)
		try {
			if (!selectedMint) { return }
			const token = await sendToken(selectedMint.mintUrl, +amount, memo, selectedProofs)
			// add as history entry
			await addToHistory({
				amount: -amount,
				type: 1,
				value: token,
				mints: [selectedMint.mintUrl],
			})
			nav.navigation.navigate('sendToken', { token, amount })
		} catch (e) {
			l(e)
			if (isErr(e)) {
				setPayError({ open: true, msg: e.message })
				stopLoading()
				return
			}
			setPayError({ open: true, msg: t('createTokenErr') })
		}
		stopLoading()
	}
	// coin selection
	useEffect(() => {
		if (!isSendingToken) { return }
		void (async () => {
			if (!selectedMint) { return }
			const proofsDB = (await getProofsByMintUrl(selectedMint.mintUrl)).map(p => ({ ...p, selected: false }))
			setProofs(proofsDB)
		})()
	}, [selectedMint, isSendingToken])
	return (
		<>
			<View style={styles.pickerWrap}>
				{/* Amount to send */}
				{mints.length > 0 && mintBal > 0 && isSendingToken &&
					<View style={styles.amountWrap}>
						<TextInput
							keyboardType='numeric'
							placeholder='0'
							placeholderTextColor={hi[highlight]}
							style={[styles.amount, { color: hi[highlight] }]}
							autoFocus
							caretHidden
							onChangeText={amount => setAmount(cleanUpNumericStr(amount))}
							value={amount}
							maxLength={8}
						/>
						<Txt txt='Satoshi' styles={[{ color: color.TEXT_SECONDARY, marginBottom: 20 }]} />
					</View>
				}
				{/* Mint balance, updates while selecting different mint */}
				{mints.length > 0 ?
					<View style={[globals(color).wrapContainer, styles.wrap]}>
						{/* Single mint with balance, or mint picker */}
						<MintPanel
							nav={nav}
							mints={mints}
							selectedMint={selectedMint}
							setSelectedMint={setSelectedMint}
						/>
						{mints.length > 0 && !nav.route.params?.mint &&
							<View style={styles.mintOpts}>
								<Txt txt={t('balance')} />
								<View style={styles.mintBal}>
									<Text style={[styles.mintAmount, { color: color.TEXT }]}>
										{formatInt(mintBal)}
									</Text>
									<ZapIcon width={18} height={18} color={color.TEXT} />
								</View>
							</View>
						}
						{/* Coin selection toggle */}
						{+amount > 0 && mintBal >= +amount / 1000 && !isKeyboardOpen &&
							<>
								<View style={styles.overview}>
									<Txt txt={t('coinSelection')} />
									<Switch
										trackColor={{ false: color.BORDER, true: hi[highlight] }}
										thumbColor={color.TEXT}
										onValueChange={toggleSwitch}
										value={isEnabled}
									/>
								</View>
								{getSelectedAmount(proofs) > 0 && isEnabled &&
									<View style={{ marginHorizontal: -20, marginTop: 8 }}>
										<CoinSelectionResume lnAmount={+amount} selectedAmount={getSelectedAmount(proofs)} />
									</View>
								}
							</>
						}
					</View>
					:
					<Empty txt={t('noMint') + '...'} />
				}
				{/* Token memo only if isSendingToken (sending a cashu token) */}
				{+amount > 0 && isSendingToken &&
					<TextInput
						style={globals(color, highlight).input}
						placeholder={t('addMemo')}
						placeholderTextColor={color.INPUT_PH}
						maxLength={21}
						onChangeText={setMemo}
					/>
				}
			</View>
			<View style={[
				styles.actionWrap,
				{ backgroundColor: color.BACKGROUND, marginBottom: isKeyboardOpen ? 10 : isSendingToken ? 20 : 75 }
			]}>
				{/* user has no mints */}
				{!mints.length ?
					<>
						<Button
							txt={t('addMint')}
							onPress={() => nav.navigation.navigate('mints')}
						/>
						<View style={{ marginVertical: 5 }} />
					</>
					: // user wants to send his tokens to LN
					!isSendingToken ?
						<>
							{/* Show a message if mint has not enough funds and the payment is an outgoing TX */}
							{!hasEnoughFunds() ?
								<Text style={[styles.tokenHint, { color: color.ERROR }]}>
									{t('noEnoughFunds')}!
								</Text>
								:
								<Button
									txt={nav.route.params?.send ? t('createInvoice') : t('selectAmount')}
									onPress={() => {
										// send
										if (nav.route.params?.send) {
											nav.navigation.navigate('pay invoice', {
												mint: selectedMint,
												mintBal,
											})
											return
										}
										// receive
										setLNAmountModal(true)
									}}
								/>
							}
							<View style={{ marginVertical: 5 }} />
						</>
						: // user wants to create a cashu token
						<>
							{+amount < 1 &&
								<Text style={[styles.tokenHint, { color: color.ERROR }]}>
									{mintBal > 0 ? '' : t('noEnoughFunds')}
								</Text>
							}
							{+amount > 0 && mintBal > 0 && mintBal >= +amount && !isKeyboardOpen &&
								<Button
									txt={loading ? t('creating') + '...' : t('createToken')}
									loading={loading}
									onPress={() => {
										if (loading) { return }
										void generateToken()
									}}
								/>
							}
						</>
				}
			</View>
			{/* Choose amount for LN invoice (minting) */}
			<LNInvoiceAmountModal
				lnAmountModal={lnAmountModal}
				setLNAmountModal={setLnAmountModalCB}
				mintUrl={selectedMint?.mintUrl ?? ''}
			/>
			{/* coin selection page */}
			{isEnabled &&
				<CoinSelectionModal
					mint={selectedMint}
					lnAmount={+amount}
					disableCS={() => setIsEnabled(false)}
					proofs={proofs}
					setProof={setProofs}
				/>
			}
			{/* payment error modal */}
			<PromptModal
				header={payError.msg}
				visible={payError.open}
				close={() => setPayError({ open: false, msg: '' })}
			/>
		</>
	)
}

const styles = StyleSheet.create({
	pickerWrap: {
		width: '100%',
		marginTop: 110,
	},
	wrap: {
		marginHorizontal: -20,
		marginBottom: 20,
		paddingTop: 5,
		paddingBottom: 20,
	},
	mintOpts: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 2,
	},
	mintBal: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	mintAmount: {
		marginRight: 5
	},
	amountWrap: {
		width: '100%',
		alignItems: 'center',
	},
	amount: {
		fontSize: 40,
		width: '100%',
		textAlign: 'center',
	},
	overview: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 8,
	},
	actionWrap: {
		position: 'absolute',
		right: 0,
		bottom: 0,
		left: 0,
		paddingHorizontal: 20,
	},
	tokenHint: {
		fontSize: 20,
		fontWeight: '500',
		marginVertical: 10,
		textAlign: 'center'
	}
})