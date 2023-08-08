import { useThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { type StyleProp, Text, type TextStyle } from 'react-native'

export default function Txt({ txt, styles }: { txt: string, styles?: StyleProp<TextStyle>[] }) {
	const { color } = useThemeContext()
	return (
		<Text style={[globals(color).txt, ...(styles || [])]}>
			{txt}
		</Text>
	)
}