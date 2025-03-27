import { useThemeContext } from '@src/context/Theme'
import { type StyleProp, View,type ViewStyle } from 'react-native'
import { ScaledSheet, vs } from 'react-native-size-matters'

interface ISeparatorProps {
	style?: StyleProp<ViewStyle>[]
	noMargin?: boolean
}

export default function Separator({ style, noMargin }: ISeparatorProps) {
	const { color } = useThemeContext()
	return <View style={[
		styles.separator,
		{
			borderColor: color.DARK_BORDER,
			marginBottom: noMargin ? 0 : vs(20)
		},
		...(style || [])
	]} />
}

const styles = ScaledSheet.create({
	separator: {
		borderBottomWidth: 1,
	}
})