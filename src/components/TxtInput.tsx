import { useThemeContext } from '@src/context/Theme'
import { globals, highlight as hi } from '@styles'
import { createRef, type LegacyRef, useEffect } from 'react'
import { type KeyboardTypeOptions, type NativeSyntheticEvent, type StyleProp, TextInput, type TextInputSubmitEditingEventData, type TextStyle } from 'react-native'
import { vs } from 'react-native-size-matters'

interface ITxtInputProps {
	keyboardType?: KeyboardTypeOptions
	placeholder: string
	onChangeText: (text: string) => void
	onSubmitEditing?: (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void
	innerRef?: LegacyRef<TextInput>
	autoFocus?: boolean
	ms?: number
	maxLength?: number
	value?: string
	multiline?: boolean
	numberOfLines?: number
	style?: StyleProp<TextStyle>
}

export default function TxtInput({
	keyboardType,
	placeholder,
	onChangeText,
	onSubmitEditing,
	innerRef,
	autoFocus,
	ms,
	maxLength,
	value,
	multiline,
	numberOfLines,
	style
}: ITxtInputProps) {
	const { color, highlight } = useThemeContext()
	const inputRef = createRef<TextInput>()
	// auto-focus
	useEffect(() => {
		if (!autoFocus) { return }
		const t = setTimeout(() => {
			inputRef.current?.focus()
			clearTimeout(t)
		}, ms || 200)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	return (
		<TextInput
			ref={innerRef || inputRef}
			keyboardType={keyboardType || 'default'}
			placeholder={placeholder}
			placeholderTextColor={color.INPUT_PH}
			selectionColor={hi[highlight]}
			cursorColor={hi[highlight]}
			onChangeText={onChangeText}
			onSubmitEditing={onSubmitEditing}
			maxLength={maxLength}
			value={value}
			multiline={multiline}
			numberOfLines={numberOfLines}
			style={[globals(color).input, { marginBottom: vs(20) }, style]}
			testID={`${placeholder}-input`}
		/>
	)
}