import { usePromptContext } from '@src/context/Prompt'
import { mainColors } from '@src/styles'
import { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Toaster() {
	const insets = useSafeAreaInsets()
	const [inView, setInView] = useState(true)
	const { prompt } = usePromptContext()
	return (
		inView &&
		<Animated.View
			entering={FadeInUp}
			exiting={FadeOutUp}
			style={[
				styles.container,
				{ backgroundColor: prompt.success ? mainColors.VALID : mainColors.ERROR, top: insets.top + 20 }
			]}
		>
			<TouchableOpacity
				onPress={() => setInView(false)}
				style={{ padding: 15 }}
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
	txt: {
		fontSize: 18,
		fontWeight: '500',
		color: '#FAFAFA'
	},
})