import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import Loading from '@comps/Loading'
import Txt from '@comps/Txt'
import TxtInput from '@comps/TxtInput'
import { isIOS } from '@consts'
import type { TMeltInputfieldPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { decodeLnInvoice, getStrFromClipboard, isErr, isLnurl, openUrl } from '@util'
import { checkFees } from '@wallet'
import { createRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { MeltOverview } from '../SelectAmount'

export default function InputfieldScreen({ navigation, route }: TMeltInputfieldPageProps) {
	const { mint, balance } = route.params
	const { t } = useTranslation([NS.common])
	const { openPromptAutoClose } = usePromptContext()
	const { color, highlight } = useThemeContext()
	const { loading, startLoading, stopLoading } = useLoading()
	const [input, setInput] = useState('')
	const inputRef = createRef<TextInput>()
	const [decodedAmount, setDecodedAmount] = useState(0)
	const [estFee, setEstFee] = useState(0)

	// Paste/Clear input for LNURL/LN invoice
	const handleInputLabelPress = async () => {
		// clear input
		if (input.length > 0) {
			setInput('')
			setDecodedAmount(0)
			return
		}
		// paste from clipboard
		const clipboard = await getStrFromClipboard()
		if (!clipboard) { return }
		setInput(clipboard)
		// pasted LNURL which does not need decoding
		if (isLnurl(clipboard)) { return }
		// pasted LN invoice
		await handleInvoicePaste(clipboard)
	}

	const handleInvoicePaste = async (clipboard: string) => {
		try {
			const { amount } = decodeLnInvoice(clipboard)
			setDecodedAmount(amount / 1000)
			startLoading()
			// l({ mintUrl: mint.mintUrl })
			const fee = await checkFees(mint.mintUrl, clipboard)
			// l({ estFee: fee })
			setEstFee(fee)
			stopLoading()
			inputRef.current?.blur()
		} catch (e) {
			// invalid LN invoice
			stopLoading()
			openPromptAutoClose({ msg: t('invalidInvoice') })
			setInput('')
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
			const { timeLeft } = decodeLnInvoice(input)
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

	return (
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				screenName={t('cashOut')}
				withBackBtn
				handlePress={() => navigation.goBack()}
			/>
			<View>
				{!input.length &&
					<Txt styles={[styles.hint]} txt={t('meltInputHint', { ns: NS.mints })} />
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
										balTooLow={decodedAmount + estFee > balance}
										fee={estFee}
										isInvoice
									/>
								</View>
								<Txt
									txt={'* ' + t('cashOutAmountHint', { ns: NS.mints })}
									styles={[styles.feeHint, { color: color.TEXT_SECONDARY }]}
								/>
							</>
						}
					</>
					:
					null
				}
			</View>
			<KeyboardAvoidingView
				behavior={isIOS ? 'padding' : undefined}
				style={styles.paddingHorizontal}
			>
				<View style={{ position: 'relative' }}>
					<TxtInput
						innerRef={inputRef}
						keyboardType='email-address'
						placeholder={t('invoiceOrLnurl')}
						value={input}
						onChangeText={setInput}
						onSubmitEditing={() => void handleBtnPress()}
						autoFocus
						ms={200}
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
			</KeyboardAvoidingView>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'column',
		justifyContent: 'space-between',
		paddingBottom: isIOS ? 50 : 20,
		paddingTop: 110,
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
		paddingVertical: 20,
		paddingBottom: 20,
		marginBottom: 0
	},
	paddingHorizontal: {
		paddingHorizontal: 20
	},
	loadingWrap: {
		marginTop: 40,
	}
})