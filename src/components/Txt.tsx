import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { type StyleProp, Text, type TextStyle } from 'react-native'

export default function Txt({ txt, styles }: { txt: string, styles?: StyleProp<TextStyle>[] }) {
	const { color, highlight } = useContext(ThemeContext)
	return (
		<Text style={[globals(color, highlight).txt, ...(styles || [])]}>
			{txt}
		</Text>
	)
}