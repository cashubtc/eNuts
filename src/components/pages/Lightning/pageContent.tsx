import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import { ZapIcon } from '@comps/Icons'
import LNInvoiceAmountModal from '@comps/InvoiceAmount'
import { getProofsByMintUrl } from '@db'
import { l } from '@log'
import { PromptModal } from '@modal/Prompt'
import { IMintUrl, IProofSelection } from '@model'
import { TLightningPageProps, TSendTokenPageProps } from '@model/nav'
import { CoinSelectionModal, CoinSelectionResume } from '@pages/Lightning/modal'
import { useKeyboard } from '@src/context/Keyboard'
import { ThemeContext } from '@src/context/Theme'
import { addToHistory } from '@store/HistoryStore'
import { globals, highlight as hi } from '@styles'
import { formatInt, getSelectedAmount } from '@util'
import { sendToken } from '@wallet'
import { useCallback, useContext, useEffect, useState } from 'react'
import { Platform, StyleSheet, Switch, Text, TextInput, View } from 'react-native'

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
	// generate spendable token
	const generateToken = async () => {
		startLoading()
		// coin selection
		const selectedProofs = proofs.filter(p => p.selected)
		try {
			if (!selectedMint) { return }
			const token = await sendToken(selectedMint.mint_url, +amount, memo, selectedProofs)
			// add as history entry
			await addToHistory({
				amount: -amount,
				type: 1,
				value: token,
				mints: [selectedMint.mint_url],
			})
			nav.navigation.navigate('sendToken', { token, amount })
		} catch (e) {
			l(e)
			if (e instanceof Error) {
				setPayError({ open: true, msg: e.message })
				stopLoading()
				return
			}
			setPayError({ open: true, msg: 'Could not create a spendable token. Please try again later.' })
		}
		stopLoading()
	}
	// coin selection
	useEffect(() => {
		if (!isSendingToken) { return }
		void (async () => {
			if (!selectedMint) { return }
			const proofsDB = (await getProofsByMintUrl(selectedMint.mint_url)).map(p => ({ ...p, selected: false }))
			setProofs(proofsDB)
		})()
	}, [selectedMint])
	return (
		<>
			<View style={styles.pickerWrap}>
				{/* header */}
				{!isSendingToken &&
					<Text style={[styles.lnHint, { color: color.TEXT }]}>
						{nav.route.params?.mint ?
							'Pay to a Lightning wallet'
							:
							`Select a mint ${nav.route.params?.send ? 'to pay from' : ''}`
						}
					</Text>
				}
				{/* Single mint with balance, or mint picker */}
				<MintPanel
					nav={nav}
					mints={mints}
					selectedMint={selectedMint}
					setSelectedMint={setSelectedMint}
				/>
				{/* Mint balance, updates while selecting different mint */}
				{mints.length > 0 && !nav.route.params?.mint &&
					<View style={[styles.mintOpts, { borderBottomColor: color.BORDER }]}>
						<Text style={globals(color).txt}>
							Balance
						</Text>
						<View style={styles.mintBal}>
							<Text style={[styles.mintAmount, { color: color.TEXT }]}>
								{formatInt(mintBal)}
							</Text>
							<ZapIcon width={18} height={18} color={color.TEXT} />
						</View>
					</View>
				}
				{!mints.length ?
					<Text style={[styles.awaitInvoice, { color: color.TEXT }]}>
						Found no mints
					</Text>
					: null
				}
				{/* Coin selection toggle */}
				{+amount > 0 && mintBal >= +amount / 1000 && !isKeyboardOpen &&
					<>
						<View style={styles.overview}>
							<Text style={globals(color).txt}>
								Coin selection
							</Text>
							<Switch
								trackColor={{ false: color.INPUT_BG, true: hi[highlight] }}
								thumbColor={color.TEXT}
								onValueChange={toggleSwitch}
								value={isEnabled}
							/>
						</View>
						{getSelectedAmount(proofs) > 0 && isEnabled &&
							<CoinSelectionResume lnAmount={+amount} selectedAmount={getSelectedAmount(proofs)} />
						}
					</>
				}
				{/* Amount to send */}
				{mints.length > 0 && mintBal > 0 && isSendingToken &&
					<View style={styles.amountWrap}>
						<TextInput
							keyboardType={Platform.OS === 'android' ? 'number-pad' : 'numeric'}
							placeholder='0'
							placeholderTextColor={hi[highlight]}
							style={[styles.amount, { color: hi[highlight] }]}
							autoFocus={isSendingToken}
							caretHidden
							onChangeText={setAmount}
							maxLength={8}
						/>
						<Text style={[globals(color).modalTxt, { color: color.TEXT_SECONDARY }]}>
							Satoshi
						</Text>
					</View>
				}
				{/* Token memo only if isSendingToken */}
				{+amount > 0 && isSendingToken &&
					<TextInput
						style={globals(color, highlight).input}
						placeholder='Add a memo with max. 22 chars.'
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
							txt='Add a mint'
							onPress={() => nav.navigation.navigate('mints')}
						/>
						<View style={{ marginVertical: 5 }} />
					</>
					: // user wants to send his tokens to LN
					!isSendingToken ?
						<>
							<Button
								txt={nav.route.params?.send ? 'Create invoice' : 'Select amount'}
								onPress={() => {
									// send
									if (nav.route.params?.send) {
										if (mintBal < 1) {
											setPayError({ open: true, msg: 'Not enough funds!' })
											return
										}
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
							<View style={{ marginVertical: 5 }} />
						</>
						: // user wants to create a spendable token
						<>
							{+amount < 1 &&
								<Text style={[styles.tokenHint, { color: color.TEXT_SECONDARY }]}>
									Create a cashu token
								</Text>
							}
							{+amount > 0 && mintBal > 0 && mintBal >= +amount && !isKeyboardOpen &&
								<Button
									txt={loading ? 'Creating...' : 'Create token'}
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
				mintUrl={selectedMint?.mint_url || ''}
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
	mintOpts: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingTop: 5,
		paddingBottom: 15,
		borderBottomWidth: 1,
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
		marginTop: 20,
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
		paddingTop: 15,
	},
	awaitInvoice: {
		fontSize: 20,
		fontWeight: '500',
		marginTop: 50,
		textAlign: 'center',
	},
	actionWrap: {
		position: 'absolute',
		right: 0,
		bottom: 0,
		left: 0,
		paddingHorizontal: 20,
	},
	sendBtnWrap: {
		marginTop: 25,
		marginBottom: 25,
	},
	lnHint: {
		fontSize: 20,
		fontWeight: '500',
		marginVertical: 15,
		textAlign: 'center',
		lineHeight: 30,
	},
	tokenHint: {
		fontSize: 20,
		fontWeight: '500',
		marginVertical: 10,
		textAlign: 'center'
	}
})