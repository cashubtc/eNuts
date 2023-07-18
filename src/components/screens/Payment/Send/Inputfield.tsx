import Button from '@comps/Button'
import Txt from '@comps/Txt'
import { TMeltInputfieldPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { highlight as hi } from '@styles/colors'
import * as Clipboard from 'expo-clipboard'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function InputfieldScreen({ route }: TMeltInputfieldPageProps) {
	const { mint } = route.params
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const [input, setInput] = useState('')
	const handleInput = async () => {
		if (input.length > 0) {
			setInput('')
			return
		}
		const clipboard = await Clipboard.getStringAsync()
		if (!clipboard || clipboard === 'null') { return }
		// TODO check if is lnurl and navigate accordingly
	}
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName={t('cashOut')} withBackBtn />
			{/* TODO translate */}
			<Txt txt='Type in a valid LNURL or a Lightning invoice.' />
			<View>
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
				{/* TODO check input.length to show continue btn */}
				<Button
					outlined
					txt='create via wallet'
					onPress={() => {
						//
					}}
				/>
			</View>
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