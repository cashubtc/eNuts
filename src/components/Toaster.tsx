import { mainColors } from '@src/styles'
import { StyleSheet, Text } from 'react-native'
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated'

export default function Toaster({ success, txt, top }: { success?: boolean, txt: string, top?: boolean }) {
	return (
		<Animated.View
			entering={FadeInUp}
			exiting={FadeOutUp}
			style={[
				styles.container,
				{ backgroundColor: success ? mainColors.VALID : '#FF6666', top: top ? 20 : 50 }
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