import { useThemeContext } from '@src/context/Theme'
import { globals, highlight as hi } from '@styles'
import { View } from 'react-native'

export default function RadioBtn({ selected }: { selected?: boolean }) {
	const { color, highlight } = useThemeContext()
	return (
		<View
			style={[
				globals(color, highlight).radioBtn,
				{ backgroundColor: selected ? hi[highlight] : 'transparent' }
			]}
		/>
	)
}