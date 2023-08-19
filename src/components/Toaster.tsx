import { usePromptContext } from '@src/context/Prompt'
import { mainColors } from '@src/styles'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Toaster() {
	const insets = useSafeAreaInsets()
	const { prompt, closePrompt } = usePromptContext()
	return (
		prompt.open &&
		<Animated.View
			entering={FadeInUp}
			exiting={FadeOutUp}
			style={[
				styles.container,
				{ backgroundColor: prompt.success ? mainColors.VALID : mainColors.ERROR, top: insets.top + 20 }
			]}
		>
			<TouchableOpacity
				onPress={closePrompt}
				style={styles.txtWrap}
			>
				<Text style={styles.txt}>
					{prompt.msg}
				</Text>
			</TouchableOpacity>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		alignItems: 'center',
		left: 20,
		right: 20,
		borderRadius: 8,
		shadowColor: '#171717',
		shadowOffset: { width: 3, height: 3 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 20,
	},
	txtWrap: {
		width: '100%',
		padding: 15,
		alignItems: 'center',
		justifyContent: 'center',
	},
	txt: {
		fontSize: 18,
		fontWeight: '500',
		color: mainColors.WHITE,
		textAlign: 'center'
	},
})