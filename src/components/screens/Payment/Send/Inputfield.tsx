import Button from '@comps/Button'
import usePrompt from '@comps/hooks/Prompt'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import type { TMeltInputfieldPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { highlight as hi } from '@styles/colors'
import { isErr, openUrl } from '@util'
import * as Clipboard from 'expo-clipboard'
import { createRef, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function InputfieldScreen({ route }: TMeltInputfieldPageProps) {
	const { mint } = route.params
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
	}
	const openLNWallet = async () => {
		await openUrl('lightning://')?.catch(e =>
			openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') }))
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
					outlined
					txt='create via wallet'
					onPress={() => void openLNWallet()}
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