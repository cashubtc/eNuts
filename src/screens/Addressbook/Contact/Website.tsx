import { LinkIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { useThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export default function Website({ website, onPress }: { website?: string, onPress: (url: string) => void }) {
	const { highlight } = useThemeContext()
	return (
		website?.length ?
			<View style={styles.infoWrap}>
				<View style={styles.iconWrap}>
					<LinkIcon width={20} height={20} color={hi[highlight]} />
				</View>
				<TouchableOpacity onPress={() => onPress(website)}>
					<Txt txt={website.split('://')[1]} styles={[{color: hi[highlight], paddingBottom: 3}]} />
				</TouchableOpacity>
			</View>
			:
			null
	)
}

const styles = StyleSheet.create({
	infoWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconWrap: {
		minWidth: 25,
	}
})