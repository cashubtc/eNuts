import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { View } from 'react-native'

export default function Container({ children }: { children: React.ReactNode }) {
	const { color } = useContext(ThemeContext)
	return (
		<View style={globals(color).container}>
			{children}
		</View>
	)
}