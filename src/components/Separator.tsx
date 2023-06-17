import { ThemeContext } from '@src/context/Theme'
import { useContext } from 'react'
import { type StyleProp, StyleSheet, type TextStyle, View } from 'react-native'

export default function Separator({ style }: { style?: StyleProp<TextStyle>[] }) {
	const { color } = useContext(ThemeContext)
	return <View style={[styles.separator, { borderColor: color.BORDER }, ...(style || [])]} />
}

const styles = StyleSheet.create({
	separator: {
		borderBottomWidth: 1
	}
})