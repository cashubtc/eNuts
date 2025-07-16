import { useThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { ActivityIndicator, Image } from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'

interface ILoadingProps {
	color?: string
	size?: number | 'small' | 'large'
	nostr?: boolean
}

export default function Loading({ color, size, nostr }: ILoadingProps) {
	const { highlight } = useThemeContext()
	return nostr ? <NostrIndicator /> : <ActivityIndicator size={size} color={color || hi[highlight]} />
}

function NostrIndicator() {
	return (
		<Image
			 
			source={require('@assets/nostrGif.gif')}
			style={styles.nostrGif}
		/>
	)
}

const styles = ScaledSheet.create({
	nostrGif: {
		width: '100@s',
		height: '100@s',
	}
})