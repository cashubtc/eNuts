import { mainColors } from '@src/styles'
import { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Toaster({ success, txt }: { success?: boolean, txt: string }) {
	const insets = useSafeAreaInsets()
	const [inView, setInView] = useState(true)
	return (
		inView &&
		<Animated.View
			entering={FadeInUp}
			exiting={FadeOutUp}
			style={[
				styles.container,
				{ backgroundColor: success ? mainColors.VALID : mainColors.ERROR, top: insets.top + 20 }
			]}
		>
			<TouchableOpacity
				onPress={() => setInView(false)}
				style={{ padding: 15 }}
			>
				<Text style={styles.txt}>
					{txt}
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
	},
	txt: {
		fontSize: 18,
		fontWeight: '500',
		color: '#FAFAFA'
	},
})