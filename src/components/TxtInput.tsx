import { useThemeContext } from '@src/context/Theme'
import { globals, highlight as hi } from '@styles'
import { createRef, type LegacyRef, useEffect } from 'react'
import { type KeyboardTypeOptions, type NativeSyntheticEvent, TextInput, type TextInputSubmitEditingEventData } from 'react-native'

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
	value
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
			style={[globals(color).input, { marginBottom: 20 }]}
		/>
	)
}