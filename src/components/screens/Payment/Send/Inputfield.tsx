import { getDecodedLnInvoice } from '@cashu/cashu-ts'
import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import usePrompt from '@comps/hooks/Prompt'
import Loading from '@comps/Loading'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import type { TMeltInputfieldPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { highlight as hi } from '@styles/colors'
import { decodeLnInvoice, isErr, isLnurl, openUrl } from '@util'
import { checkFees } from '@wallet'
import * as Clipboard from 'expo-clipboard'
import { createRef, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { MeltOverview } from '../SelectAmount'

export default function InputfieldScreen({ navigation, route }: TMeltInputfieldPageProps) {
	const { mint, balance } = route.params
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const { loading, startLoading, stopLoading } = useLoading()
	const [input, setInput] = useState('')
	const inputRef = createRef<TextInput>()
	const [decodedAmount, setDecodedAmount] = useState(0)
	const [estFee, setEstFee] = useState(0)
	const { prompt, openPromptAutoClose } = usePrompt()
	// Paste/Clear input for LNURL/LN invoice
	const handleInputLabelPress = async () => {
		// clear input
		if (input.length > 0) {
			setInput('')
			setDecodedAmount(0)
			return
		}
		inputRef.current?.blur()
		// paste from clipboard
		const clipboard = await Clipboard.getStringAsync()
		if (!clipboard || clipboard === 'null') { return }
		setInput(clipboard)
		// pasted LNURL which does not need decoding
		if (isLnurl(clipboard)) { return }
		// pasted LN invoice
		await handleInvoicePaste(clipboard)
	}
	const handleInvoicePaste = async (clipboard: string) => {
		try {
			const decoded = decodeLnInvoice(clipboard)
			setDecodedAmount(decoded.amount / 1000)
			startLoading()
			const fee = await checkFees(mint.mintUrl, clipboard)
			setEstFee(fee)
			stopLoading()
		} catch (e) {
			// invalid LN invoice
			stopLoading()
			openPromptAutoClose({ msg: t('invalidInvoice') })
		}
	}
	const handleBtnPress = async () => {
		if (loading) { return }
		// open user LN wallet
		if (!input.length) {
			await openUrl('lightning://')?.catch(e =>
				openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') }))
			return
		}
		// user pasted a LNURL, we need to get the amount by the user
		if (isLnurl(input)) {
			// we could check if the provided lnurl is in the contact-list of user and if not, provide the possibility to save it.
			navigation.navigate('selectAmount', { mint, balance, isMelt: true, lnurl: input })
			return
		}
		// not enough funds
		if (decodedAmount + estFee > balance) {
			openPromptAutoClose({ msg: t('noFunds') })
			return
		}
		// user pasted a LN invoice before submitting
		try {
			// decode again in case the user changes the input after pasting it
			const ln = getDecodedLnInvoice(input)
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const timePassed = Math.ceil(Date.now() / 1000) - (ln.sections[4]!.value as number)
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const timeLeft = ln.sections[8]!.value as number - timePassed
			// Invoice expired
			if (timeLeft <= 0) {
				openPromptAutoClose({ msg: t('expired') + '!' })
				return
			}
			// navigate to coin selection screen
			navigation.navigate('coinSelection', {
				mint,
				balance,
				amount: decodedAmount,
				estFee,
				isMelt: true,
				recipient: input
			})
		} catch (e) {
			// invalid invoice
			openPromptAutoClose({ msg: t('invalidInvoice') })
		}
	}
	// auto-focus keyboard
	useEffect(() => {
		const t = setTimeout(() => {
			inputRef.current?.focus()
			clearTimeout(t)
		}, 200)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	// handle case if user pastes value using the device keyboard
	useEffect(() => {
		if (isLnurl(input)) { return }
		// https://bitcoin.stackexchange.com/questions/107930/what-are-the-minimum-and-maximum-lengths-of-a-lightning-invoice-address
		if (input.length < 100) { return }
		void handleInvoicePaste(input)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [input])
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName={t('cashOut')} withBackBtn />
			<View>
				{!input.length &&
					<Txt styles={[styles.hint]} txt={t('meltInputHint', { ns: 'mints' })} />
				}
				{decodedAmount > 0 ?
					<>
						{loading ?
							<View style={styles.loadingWrap}>
								<Loading size={25} />
							</View>
							:
							<>
								<View style={[globals(color).wrapContainer, styles.overviewWrap]}>
									<MeltOverview
										amount={decodedAmount}
										balance={balance}
										balTooLow={decodedAmount + estFee > balance}
										fee={estFee}
										isInvoice
									/>
								</View>
								<Txt
									txt={'* ' + t('cashOutAmountHint', { ns: 'mints' })}
									styles={[styles.feeHint, { color: color.TEXT_SECONDARY }]}
								/>
							</>
						}
					</>
					:
					null
				}
			</View>
			<View style={styles.paddingHorizontal}>
				<View style={{ position: 'relative' }}>
					<TextInput
						keyboardType='email-address'
						ref={inputRef}
						style={[globals(color).input, { marginBottom: 20 }]}
						placeholder={t('invoiceOrLnurl')}
						placeholderTextColor={color.INPUT_PH}
						selectionColor={hi[highlight]}
						value={input}
						onChangeText={setInput}
						onSubmitEditing={() => void handleBtnPress()}
					/>
					{/* Paste / Clear Input */}
					<TouchableOpacity
						style={[styles.pasteInputTxtWrap, { backgroundColor: color.INPUT_BG }]}
						onPress={() => void handleInputLabelPress()}
					>
						<Text style={globals(color, highlight).pressTxt}>
							{!input.length ? t('paste') : t('clear')}
						</Text>
					</TouchableOpacity>
				</View>
				<Button
					outlined={!input.length}
					disabled={loading}
					txt={input.length > 0 ? t('continue') : t('createViaLn')}
					onPress={() => void handleBtnPress()}
				/>
			</View>
			{prompt.open && <Toaster txt={prompt.msg} />}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'space-between',
		paddingTop: 110,
		paddingBottom: 20,
	},
	hint: {
		paddingHorizontal: 20,
		marginBottom: 20,
		fontWeight: '500',
	},
	feeHint: {
		fontSize: 12,
		paddingHorizontal: 20,
		marginTop: 10,
	},
	pasteInputTxtWrap: {
		position: 'absolute',
		right: 10,
		top: 10,
		padding: 10
	},
	overviewWrap: {
		width: '100%',
		paddingVertical: 20
	},
	paddingHorizontal: {
		paddingHorizontal: 20
	},
	loadingWrap: {
		marginTop: 40,
	}
})