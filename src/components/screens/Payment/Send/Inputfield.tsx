import Button from '@comps/Button'
import usePrompt from '@comps/hooks/Prompt'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import type { TMeltInputfieldPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { highlight as hi } from '@styles/colors'
import { decodeLnInvoice, isErr, isLnurl, openUrl } from '@util'
import * as Clipboard from 'expo-clipboard'
import { createRef, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function InputfieldScreen({ navigation, route }: TMeltInputfieldPageProps) {
	const { mint, balance } = route.params
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const [input, setInput] = useState('')
	const inputRef = createRef<TextInput>()
	const { prompt, openPromptAutoClose } = usePrompt()
	// Paste/Clear input for LNURL/LN invoice
	const handleInputLabelPress = async () => {
		if (input.length > 0) {
			setInput('')
			return
		}
		const clipboard = await Clipboard.getStringAsync()
		if (!clipboard || clipboard === 'null') { return }
		// TODO setInput with clipboard value
	}
	const handleBtnPress = async () => {
		if (!input.length) {
			await openUrl('lightning://')?.catch(e =>
				openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') }))
			return
		}
		// user pastes a LNURL, we need to get the amount by the user
		if (isLnurl(input)) {
			navigation.navigate('selectAmount', { mint, balance, isMelt: true, lnurl: input })
			return
		}
		// user pastes a LN invoice where we can get the amount from
		try {
			const decoded = decodeLnInvoice(input)
			// we should get estimated fee
			// we can check if user has enough balance after adding estimated fee to ln invoice
			// only navigate to coin selection screen if enough balance
			navigation.navigate('coinSelection', {
				mint,
				amount: decoded.amount,
				estFee: 0,
				isMelt: true,
				recipient: input
			})
		} catch (e) {
			//
		}
	}
	// auto-focus keyboard
	useEffect(() => {
		const t = setTimeout(() => {
			inputRef.current?.focus()
			clearTimeout(t)
		}, 200)
	}, [inputRef])
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName={t('cashOut')} withBackBtn />
			{/* TODO translate */}
			<Txt txt='Type in a valid LNURL or a Lightning invoice.' />
			<View>
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
				{/* TODO check input.length to show continue btn */}
				{/* TODO check if is lnurl and navigate accordingly */}
				<Button
					outlined={!input.length}
					txt={input.length > 0 ? 'Continue' : 'create via wallet'}
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
		paddingHorizontal: 20,
		paddingBottom: 20,
	},
	pasteInputTxtWrap: {
		position: 'absolute',
		right: 10,
		top: 10,
		padding: 10
	},
})