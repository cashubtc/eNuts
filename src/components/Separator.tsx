import { useThemeContext } from '@src/context/Theme'
import { type StyleProp, StyleSheet, type TextStyle, View } from 'react-native'

export default function Separator({ style }: { style?: StyleProp<TextStyle>[] }) {
	const { color } = useThemeContext()
	return <View style={[styles.separator, { borderColor: color.BORDER }, ...(style || [])]} />
}

const styles = StyleSheet.create({
	separator: {
		borderBottomWidth: 1
	}
})