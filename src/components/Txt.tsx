import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { type StyleProp, Text, type TextStyle } from 'react-native'

export default function Txt({ txt, styles }: { txt: string; styles?: StyleProp<TextStyle>[] }) {
	const { color } = useContext(ThemeContext)
	return <Text style={[globals(color).txt, ...(styles || [])]}>{txt}</Text>
}
