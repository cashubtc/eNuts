import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { useContext } from 'react'
import { ActivityIndicator, Image, StyleSheet } from 'react-native'

interface ILoadingProps {
	color?: string
	size?: number | 'small' | 'large'
	nostr?: boolean
}

export default function Loading({ color, size, nostr }: ILoadingProps) {
	const { highlight } = useContext(ThemeContext)
	return nostr ? <NostrIndicator /> : <ActivityIndicator size={size} color={color || hi[highlight]} />
}

function NostrIndicator() {
	return (
		<Image
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			source={require('@assets/nostrGif.gif')}
			style={styles.nostrGif}
		/>
	)
}

const styles = StyleSheet.create({
	nostrGif: {
		width: 100,
		height: 100,
	}
})