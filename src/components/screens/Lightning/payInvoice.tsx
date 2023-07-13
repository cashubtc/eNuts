import { getDecodedLnInvoice } from '@cashu/cashu-ts'
import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import usePrompt from '@comps/hooks/Prompt'
import { ZapIcon } from '@comps/Icons'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import { getProofsByMintUrl } from '@db'
import { l } from '@log'
import type { IProofSelection } from '@model'
import type { TPayLNInvoicePageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import AddressbookModal from '@screens/Addressbook/modal'
import { CoinSelectionModal, CoinSelectionResume } from '@screens/Lightning/modal'
import { isIOS } from '@src/consts'
import { useKeyboard } from '@src/context/Keyboard'
import { ThemeContext } from '@src/context/Theme'
import { sumProofsValue } from '@src/wallet/proofs'
import { addLnPaymentToHistory } from '@store/HistoryStore'
import { globals, highlight as hi } from '@styles'
import { cleanUpNumericStr, formatInt, formatMintUrl, formatSeconds, getInvoiceFromLnurl, getSelectedAmount, isErr, isLnurl, openUrl } from '@util'
import { checkFees, payLnInvoice } from '@wallet'
import * as Clipboard from 'expo-clipboard'
import { useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'

// TODO adapt style
export default function PayInvoicePage({ navigation, route }: TPayLNInvoicePageProps) {
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const { isKeyboardOpen } = useKeyboard()
	// LNURL amount state
	const [LNURLAmount, setLNURLAmount] = useState('')
	// LN invoice amount
	const [invoiceAmount, setInvoiceAmount] = useState(0)
	// LN invoice time left until expiry
	const [timeLeft, setTimeLeft] = useState(0)
	// LN fees
	const [feeEstimate, setFeeEstimate] = useState(0)
	const [isCalculatingFee, setIsCalculatingFee] = useState(false)
	// Coin selection
	const [proofs, setProofs] = useState<IProofSelection[]>([])
	const [isEnabled, setIsEnabled] = useState(false)
	const toggleSwitch = () => setIsEnabled(prev => !prev)
	// address book page
	const [showAddressBook, setShowAddressBook] = useState(false)
	// LN input
	const [input, setInput] = useState('')
	const setInputCB = useCallback((val: string) => setInput(val), [])
	const { prompt, openPromptAutoClose } = usePrompt()
	const { loading, startLoading, stopLoading } = useLoading()
	// LN payment
	const handleTokenSend = async () => {
		if (!route.params.mint) { return }
		startLoading()
		// coin selection
		const selectedProofs = proofs.filter(p => p.selected)
		// Pay invoice
		if (!isLnurl(input)) {
			try {
				const res = await payLnInvoice(route.params.mint.mintUrl, input, selectedProofs)
				stopLoading()
				if (!res.result?.isPaid) {
					openPromptAutoClose({ msg: t('invoiceErr') })
					return
				}
				// payment success, add as history entry
				await addLnPaymentToHistory(
					res,
					[route.params.mint.mintUrl],
					-invoiceAmount,
					input
				)
				navigation.navigate('success', {
					amount: invoiceAmount + res.realFee,
					fee: res.realFee,
					mints: [route.params.mint.mintUrl]
				})
			} catch (e) {
				l(e)
				openPromptAutoClose({ msg: isErr(e) ? e.message : t('invoicePayErr') })
				stopLoading()
			}
			return
		}
		// else: handle LNURL input
		try {
			const invoice = await getInvoiceFromLnurl(input.trim(), +LNURLAmount)
			if (!invoice?.length) {
				openPromptAutoClose({ msg: t('generateInvoiceErr', { input }) })
				stopLoading()
				return
			}
			// amount of proofs selected
			const totalSelected = sumProofsValue(selectedProofs)
			const totalToPay = +LNURLAmount + feeEstimate
			if (isEnabled && totalSelected < totalToPay) {
				openPromptAutoClose({ msg: t('invoiceLowFunds', { totalToPay, LNURLAmount }) })
				stopLoading()
				return
			}
			const res = await payLnInvoice(route.params.mint.mintUrl, invoice, selectedProofs)
			stopLoading()
			if (!res.result?.isPaid) {
				openPromptAutoClose({ msg: t('invoicePayErr') })
				stopLoading()
				return
			}
			// payment success
			stopLoading()
			// add as history entry
			await addLnPaymentToHistory(
				res,
				[route.params.mint.mintUrl],
				-LNURLAmount,
				invoice
			)
			navigation.navigate('success', {
				amount: +LNURLAmount + res.realFee,
				fee: res.realFee,
				mints: [route.params.mint.mintUrl]
			})
		} catch (e) {
			openPromptAutoClose({ msg: isErr(e) ? e.message : t('invoicePayErr') })
			stopLoading()
		}
	}
	// Only for handling fee estimation for the amount selected to send to a LNURL
	const handleKeyboard = async () => {
		// reset fee after keyboard appears
		if (isKeyboardOpen) {
			setFeeEstimate(0)
			return
		}
		// else: get estimated fee after keyboard dissapears and an amount has been provided
		if (+LNURLAmount > 0 && !isKeyboardOpen) {
			setIsCalculatingFee(true)
			const invoice = await getInvoiceFromLnurl(input.trim(), +LNURLAmount)
			if (!invoice?.length || !route.params.mint) {
				openPromptAutoClose({ msg: t('feeErr', { input }) })
				// reset amount to hide the failed estimated fee render
				setLNURLAmount('')
				// remove LNURL from input to re-render the initial page
				setInput('')
				setIsCalculatingFee(false)
				return
			}
			const fee = await checkFees(route.params.mint.mintUrl, invoice)
			setFeeEstimate(fee)
			setIsCalculatingFee(false)
		}
	}
	// Paste/Clear input for LNURL/LN invoice
	const handleInput = async () => {
		if (input.length > 0) {
			setInput('')
			setLNURLAmount('')
			return
		}
		const clipboard = await Clipboard.getStringAsync()
		if (!clipboard || clipboard === 'null' || !route.params.mint) { return }
		try {
			setFeeEstimate(await checkFees(route.params.mint.mintUrl, clipboard))
			setInput(clipboard)
		} catch (e) {
			l(e)
			openPromptAutoClose({ msg: t('invalidInvoice') })
		}
	}
	// Get proofs for coin selection
	useEffect(() => {
		void (async () => {
			if (!route.params.mint) { return }
			const proofsDB = (await getProofsByMintUrl(route.params.mint.mintUrl)).map(p => ({ ...p, selected: false }))
			setProofs(proofsDB)
		})()
	}, [route.params.mint])
	// set ln info on input change
	useEffect(() => {
		// early return if user clears the input field
		if (!input.length) {
			setInvoiceAmount(0)
			setTimeLeft(0)
			setIsEnabled(false)
			return
		}
		if (isLnurl(input)) { return }
		// else: decode LN invoide and show invoice info
		try {
			const ln = getDecodedLnInvoice(input)
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			setInvoiceAmount(ln.sections[2]!.value as number)
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const timePassed = Math.ceil(Date.now() / 1000) - (ln.sections[4]!.value as number)
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			setTimeLeft(ln.sections[8]!.value as number - timePassed)
		} catch (e) {
			l(e)
		}
	}, [input])
	// LN invoice expiry time
	useEffect(() => {
		if (timeLeft < 0) {
			setTimeLeft(0)
			return
		}
		if (timeLeft && timeLeft > 0) {
			setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
		}
	}, [timeLeft])
	// Get estimated fees every time the keyboard dissapears and conditions have passed
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => void handleKeyboard(), [isKeyboardOpen])
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName='Zap' withBackBtn />
			{/* mint overview */}
			{!input.length &&
				<View style={styles.amountWrap}>
					<Text style={[globals(color).modalTxt, { color: color.TEXT_SECONDARY, marginBottom: 10 }]}>
						{t('sendBtcHint', { mintUrl: formatMintUrl(route.params.mint?.mintUrl || '') })}
					</Text>
					<Text style={[globals(color).modalTxt, { color: color.TEXT_SECONDARY, marginBottom: 0 }]}>
						{t('mintBalance')}: <Text style={{ fontWeight: '500' }}>{formatInt(route.params.mintBal)}</Text> Satoshi
					</Text>
				</View>
			}
			{/* LNURL amount to choose */}
			{isLnurl(input) &&
				<View style={styles.amountWrap}>
					<Text style={[globals(color).navTxt, styles.payTo]}>
						Select amount for &quot;{input}&quot;
					</Text>
					<TextInput
						keyboardType='numeric' // Platform.OS === 'android' ? 'number-pad' : 'numeric'
						placeholder='0'
						placeholderTextColor={hi[highlight]}
						style={[styles.amount, { color: hi[highlight] }]}
						caretHidden
						onChangeText={amount => setLNURLAmount(cleanUpNumericStr(amount))}
						maxLength={8}
						value={LNURLAmount}
					/>
					<Text style={[globals(color).modalTxt, { color: color.TEXT_SECONDARY, marginBottom: 0 }]}>
						Satoshi
					</Text>
				</View>
			}
			{/* Only for LNURL: Show the estimated fees after keyboard dissapears and amount has been provided */}
			{+LNURLAmount > 0 && !isKeyboardOpen &&
				<View style={styles.lnUrlFeeOverview}>
					<View style={styles.overview}>
						{isCalculatingFee ?
							<Txt txt={t('calculateFeeEst') + '...'} />
							:
							<>
								<Txt txt={t('estimatedFees') + ':'} />
								<View style={styles.mintBal}>
									<Text style={[styles.mintAmount, { color: color.TEXT }]}>
										0 {t('to')} {formatInt(feeEstimate)}
									</Text>
									<ZapIcon width={18} height={18} color={color.TEXT} />
								</View>
							</>
						}
					</View>
				</View>
			}
			{/* LN invoice info overview */}
			{invoiceAmount > 0 &&
				<View style={styles.invoiceOverview}>
					{/* Invoice expiry */}
					<View style={styles.overviewWrap}>
						<Text style={[globals(color).navTxt]}>
							Invoice overview
						</Text>
						<Text style={[styles.expiry, { color: !timeLeft ? color.ERROR : color.TEXT }]}>
							{timeLeft > 0 ? formatSeconds(timeLeft) : t('expired') + '!'}
						</Text>
					</View>
					{/* Invoice amount */}
					<View style={styles.overview}>
						<Txt txt={t('amount') + ':'} />
						<View style={styles.mintBal}>
							<Text style={[styles.mintAmount, { color: color.TEXT }]}>
								{formatInt(invoiceAmount / 1000)}
							</Text>
							<ZapIcon width={18} height={18} color={color.TEXT} />
						</View>
					</View>
					{/* Invoice estimated fees */}
					<View style={styles.overview}>
						<Txt txt={t('estimatedFees') + ':'} />
						<View style={styles.mintBal}>
							<Text style={[styles.mintAmount, { color: color.TEXT }]}>
								0 {t('to')} {formatInt(feeEstimate)}
							</Text>
							<ZapIcon width={18} height={18} color={color.TEXT} />
						</View>
					</View>
					{/* Total after fee */}
					<View style={[
						styles.overview,
						{
							borderBottomWidth: 1,
							borderBottomColor: color.BORDER,
							paddingBottom: 15
						}
					]}>
						<Txt txt={t('total') + ':'} styles={[{ fontWeight: '500' }]} />
						<View style={styles.mintBal}>
							<Text style={[styles.mintAmount, { color: color.TEXT }]}>
								{formatInt((invoiceAmount / 1000) + feeEstimate)}
							</Text>
							<ZapIcon width={18} height={18} color={color.TEXT} />
						</View>
					</View>
				</View>
			}
			{/*
				Show coin selection if:
				- LN invoice: needs amount>0, needs balance > invoice amount and invoice not expired
				OR
				- LNURL: amount provided and keyboard is not visible
			*/}
			{((invoiceAmount > 0 && route.params.mintBal >= (invoiceAmount / 1000) + feeEstimate && timeLeft > 0)
				||
				(isLnurl(input) && +LNURLAmount > 0)) && !isKeyboardOpen &&
				<View style={styles.coinSelectionOverview}>
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
						<CoinSelectionResume
							lnAmount={(isLnurl(input) ? +LNURLAmount : invoiceAmount / 1000) + feeEstimate}
							selectedAmount={getSelectedAmount(proofs)}
							estFee={feeEstimate}
						/>
					}
				</View>
			}
			{/* Bottom section */}
			<KeyboardAvoidingView style={styles.action} behavior={isIOS ? 'height' : undefined}>
				{/* Open LNURL address book */}
				{invoiceAmount === 0 &&
					<TouchableOpacity
						style={styles.addrBookBtnWrap}
						onPress={() => setShowAddressBook(true)}
					>
						<Text style={globals(color, highlight).pressTxt}>
							Address book
						</Text>
					</TouchableOpacity>
				}
				{/* LN invoice / LNURL Input field */}
				<View style={{ position: 'relative' }}>
					<TextInput
						keyboardType='email-address'
						style={[globals(color).input, { marginBottom: 20 }]}
						placeholder={t('invoiceOrLnurl')}
						placeholderTextColor={color.INPUT_PH}
						selectionColor={hi[highlight]}
						value={input}
						onChangeText={setInput}
					/>
					{/* Paste / Clear Input */}
					<TouchableOpacity
						style={[styles.pasteInputTxtWrap, { backgroundColor: color.INPUT_BG }]}
						onPress={() => void handleInput()}
					>
						<Text style={globals(color, highlight).pressTxt}>
							{!input.length ? t('paste') : t('clear')}
						</Text>
					</TouchableOpacity>
				</View>
				{/* Open LN wallet to create invoice */}
				{!input.length && !isKeyboardOpen &&
					<TouchableOpacity style={{ marginVertical: 10 }} onPress={() => {
						void (async () => {
							await openUrl('lightning://')?.catch((err: unknown) =>
								openPromptAutoClose({ msg: isErr(err) ? err.message : t('deepLinkErr') }))
						})()
					}}>
						<Text style={globals(color, highlight).pressTxt}>
							{t('createViaLn')}
						</Text>
					</TouchableOpacity>
				}
				{/*
					Show Payment button if:
					- LNURL or invoice available, Invoice not expired, Payment amounts > 0, estimated fee > 0 and closed keyboard
				*/}
				{input.length > 0 && ((invoiceAmount > 0 && timeLeft > 0) || +LNURLAmount > 0) && !isKeyboardOpen && feeEstimate > 0 &&
					<Button
						txt={loading ? t('processingPayment') + '...' : t('pay')}
						loading={loading}
						onPress={() => {
							void handleTokenSend()
						}}
					/>
				}
			</KeyboardAvoidingView>
			{/* address book */}
			{showAddressBook &&
				<AddressbookModal
					closeModal={() => setShowAddressBook(false)}
					setInput={setInputCB}
				/>
			}
			{/* coin selection page */}
			{isEnabled &&
				<CoinSelectionModal
					mint={route.params.mint}
					lnAmount={(isLnurl(input) ? +LNURLAmount : invoiceAmount / 1000) + feeEstimate}
					disableCS={() => setIsEnabled(false)}
					proofs={proofs}
					setProof={setProofs}
				/>
			}
			{prompt.open && <Toaster success={prompt.success} txt={prompt.msg} />}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	payTo: {
		marginBottom: 10
	},
	lnUrlFeeOverview: {
		paddingHorizontal: 20,
		marginTop: 10,
	},
	invoiceOverview: {
		paddingHorizontal: 20,
		marginTop: 110,
	},
	coinSelectionOverview: {
		paddingHorizontal: 20,
	},
	amountWrap: {
		width: '100%',
		alignItems: 'center',
		marginTop: 110,
	},
	amount: {
		fontSize: 40,
		width: '100%',
		textAlign: 'center',
	},
	action: {
		position: 'absolute',
		right: 20,
		bottom: 20,
		left: 20
	},
	addrBookBtnWrap: {
		marginBottom: 25,
	},
	pasteInputTxtWrap: {
		position: 'absolute',
		right: 10,
		top: 10,
		padding: 10
	},
	overview: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingTop: 15,
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
	overviewWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 25,
		marginBottom: 15,
	},
	expiry: {
		fontSize: 20,
	},
})