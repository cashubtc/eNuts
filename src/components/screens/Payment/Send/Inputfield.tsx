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
		if (input.length > 0) {
			setInput('')
			setDecodedAmount(0)
			return
		}
		const clipboard = await Clipboard.getStringAsync()
		if (!clipboard || clipboard === 'null') { return }
		setInput(clipboard)
		if (isLnurl(clipboard)) { return }
		// pasted LN invoice
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
			// we need to decode again to see if the input has been changed after pasting
			const decoded = decodeLnInvoice(input)
			// TODO check for invoice expiry
			// navigate to coin selection screen
			navigation.navigate('coinSelection', {
				mint,
				amount: decoded.amount,
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
	}, [inputRef])
	// TODO handle case if user pastes value using the device keyboard
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName={t('cashOut')} withBackBtn />
			<View>
				<Txt styles={[styles.paddingHorizontal]} txt={t('invoiceInputHint', { ns: 'mints' })} />
				{decodedAmount > 0 ?
					<>
						{loading ?
							<Loading />
							:
							<MeltOverview
								amount={decodedAmount}
								balance={route.params.balance}
								balTooLow={decodedAmount + estFee > balance}
								fee={estFee}
							/>
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
	pasteInputTxtWrap: {
		position: 'absolute',
		right: 10,
		top: 10,
		padding: 10
	},
	overviewWrap: {
		width: '100%',
		marginTop: 10,
		paddingVertical: 10
	},
	paddingHorizontal: {
		paddingHorizontal: 20
	}
})