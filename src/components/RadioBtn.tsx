import { ThemeContext } from '@src/context/Theme'
import { globals, highlight as hi } from '@styles'
import { useContext } from 'react'
import { View } from 'react-native'

export default function RadioBtn({ selected }: { selected?: boolean }) {
	const { color, highlight } = useContext(ThemeContext)
	return (
		<View
			style={[
				globals(color, highlight).radioBtn,
				{ backgroundColor: selected ? hi[highlight] : 'transparent' }
			]}
		/>
	)
}