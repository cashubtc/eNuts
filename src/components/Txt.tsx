import { useThemeContext } from '@src/context/Theme'
import { globals, mainColors } from '@styles'
import { type StyleProp, Text, type TextStyle } from 'react-native'

interface ITxtProps {
	txt: string
	bold?: boolean
	center?: boolean
	error?: boolean
	success?: boolean
	styles?: StyleProp<TextStyle>[]
}

export default function Txt({ txt, bold, center, error, success, styles }: ITxtProps) {
	const { color } = useThemeContext()
	return (
		<Text
			style={[
				bold ? globals(color).txtBold : globals(color).txt,
				{
					color: error ? mainColors.ERROR : success ? mainColors.VALID : color.TEXT,
					textAlign: center ? 'center' : 'left'
				},
				...(styles || [])
			]}
			testID={`${txt}-txt`}
		>
			{txt}
		</Text>
	)
}