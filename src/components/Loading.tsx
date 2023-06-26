import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { useContext } from 'react'
import { ActivityIndicator } from 'react-native'

interface ILoadingProps {
	white?: boolean
	size?: number | 'small' | 'large'
}

export default function Loading({ white, size }: ILoadingProps) {
	const { color, highlight } = useContext(ThemeContext)
	return <ActivityIndicator size={size} color={white ? '#FAFAFA' : hi[highlight]} />
}