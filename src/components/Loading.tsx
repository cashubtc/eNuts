import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { useContext } from 'react'
import { ActivityIndicator } from 'react-native'

interface ILoadingProps {
	color?: string
	size?: number | 'small' | 'large'
}

export default function Loading({ color, size }: ILoadingProps) {
	const { highlight } = useContext(ThemeContext)
	return <ActivityIndicator size={size} color={color || hi[highlight]} />
}