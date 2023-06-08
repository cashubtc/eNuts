import { mainColors } from '@src/styles'
import { StyleSheet, Text } from 'react-native'
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated'

export default function Toaster({ success, txt }: { success?: boolean, txt: string }) {
	return (
		<Animated.View
			entering={FadeInUp}
			exiting={FadeOutUp}
			style={[styles.container, { backgroundColor: success ? mainColors.VALID : '#FF6666' }]}
		>
			<Text style={styles.txt}>
				{txt}
			</Text>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	container: {
		width: '90%',
		position: 'absolute',
		padding: 20,
		alignItems: 'center',
		top: 50,
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