import { useThemeContext } from '@src/context/Theme'
import { type StyleProp, StyleSheet, type TextStyle, View } from 'react-native'

interface ISeparatorProps {
	style?: StyleProp<TextStyle>[]
	noMargin?: boolean
}

export default function Separator({ style, noMargin }: ISeparatorProps) {
	const { color } = useThemeContext()
	return <View style={[
		styles.separator,
		{
			borderColor: color.DARK_BORDER,
			marginBottom: noMargin ? 0 : 20
		},
		...(style || [])
	]} />
}

const styles = StyleSheet.create({
	separator: {
		borderBottomWidth: 1,
	}
})