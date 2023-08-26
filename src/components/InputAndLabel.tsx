import { useThemeContext } from '@src/context/Theme'
import { useTranslation } from 'react-i18next'
import { type KeyboardTypeOptions, StyleSheet, View } from 'react-native'

import { TxtButton } from './Button'
import TxtInput from './TxtInput'

interface IInputAndLabelProps {
	keyboardType?: KeyboardTypeOptions
	placeholder: string
	setInput: (txt: string) => void
	value: string
	handleInput?: () => void
	handleLabel: () => void
	isEmptyInput?: boolean
}

export default function InputAndLabel({
	keyboardType,
	placeholder,
	setInput,
	value,
	handleInput,
	handleLabel,
	isEmptyInput
}: IInputAndLabelProps) {
	const { t } = useTranslation()
	const { color } = useThemeContext()
	return (
		<View style={styles.wrap}>
			<TxtInput
				keyboardType={keyboardType}
				placeholder={placeholder}
				value={value}
				onChangeText={setInput}
				onSubmitEditing={handleInput}
			/>
			{/* Paste / Clear Input */}
			<TxtButton
				txt={t(isEmptyInput ? 'paste' : 'clear')}
				onPress={handleLabel}
				style={[styles.pasteInputTxtWrap, { backgroundColor: color.INPUT_BG }]}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	wrap: {
		position: 'relative',
		width: '100%'
	},
	pasteInputTxtWrap: {
		position: 'absolute',
		right: 10,
		top: 10,
		paddingTop: 10,
		marginHorizontal: 10
	},
})