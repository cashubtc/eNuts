import { useThemeContext } from '@src/context/Theme'
import { mainColors } from '@styles'
import { StyleSheet, TouchableOpacity } from 'react-native'

import useCopy from './hooks/Copy'
import { CheckmarkIcon, CopyIcon } from './Icons'

export default function Copy({ txt }: { txt: string }) {

	const { color } = useThemeContext()
	const { copied, copy } = useCopy()

	return (
		<TouchableOpacity
			style={styles.copyIconWrap}
			onPress={() => void copy(txt)}
			disabled={copied}
		>
			{copied ?
				<CheckmarkIcon width={18} height={18} color={mainColors.VALID} />
				:
				<CopyIcon width={18} height={18} color={color.TEXT_SECONDARY} />
			}
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	copyIconWrap: {
		paddingHorizontal: 10,
		paddingVertical: 5,
	},
})