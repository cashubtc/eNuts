import { mainColors } from '@src/styles'
import { StyleSheet, Text } from 'react-native'
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Toaster({ success, txt }: { success?: boolean, txt: string }) {
	const insets = useSafeAreaInsets()
	return (
		<Animated.View
			entering={FadeInUp}
			exiting={FadeOutUp}
			style={[
				styles.container,
				{ backgroundColor: success ? mainColors.VALID : mainColors.ERROR, top: insets.top + 20 }
			]}
		>
			<Text style={styles.txt}>
				{txt}
			</Text>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		padding: 20,
		alignItems: 'center',
		left: 20,
		right: 20,
		borderRadius: 8,
	},
	txt: {
		fontSize: 18,
		fontWeight: '500',
		color: '#FAFAFA'
	},
})