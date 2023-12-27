import { usePromptContext } from '@src/context/Prompt'
import { mainColors } from '@src/styles'
import { TouchableOpacity } from 'react-native'
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScaledSheet } from 'react-native-size-matters'

import Txt from './Txt'

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
				{ backgroundColor: prompt.success ? mainColors.VALID : mainColors.ERROR, top: insets.top }
			]}
		>
			<TouchableOpacity
				onPress={closePrompt}
				style={styles.txtWrap}
			>
				<Txt txt={prompt.msg} styles={[styles.txt]} />
			</TouchableOpacity>
		</Animated.View>
	)
}

const styles = ScaledSheet.create({
	container: {
		position: 'absolute',
		alignItems: 'center',
		left: '20@s',
		right: '20@s',
		borderRadius: 8,
		shadowColor: '#171717',
		shadowOffset: { width: 3, height: 3 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 20,
	},
	txtWrap: {
		width: '100%',
		padding: '15@s',
		alignItems: 'center',
		justifyContent: 'center',
	},
	txt: {
		fontSize: '16@vs',
		color: mainColors.WHITE,
		textAlign: 'center',
	},
})