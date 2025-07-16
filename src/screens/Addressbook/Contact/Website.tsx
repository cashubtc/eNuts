import { LinkIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { useThemeContext } from '@src/context/Theme'
import { extractStrFromURL } from '@src/util'
import { highlight as hi } from '@styles'
import { TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

export default function Website({ website, onPress }: { website?: string, onPress: (url: string) => void }) {
	const { highlight } = useThemeContext()
	const site = extractStrFromURL(website) || website
	const navSite = website?.includes('://') ? website : `https://${website}`
	return (
		site?.length ?
			<View style={styles.infoWrap}>
				<View style={styles.iconWrap}>
					<LinkIcon width={s(18)} height={s(18)} color={hi[highlight]} />
				</View>
				<TouchableOpacity onPress={() => onPress(navSite || '')}>
					<Txt txt={site} styles={[{ color: hi[highlight], paddingBottom: vs(3) }]} />
				</TouchableOpacity>
			</View>
			:
			null
	)
}

const styles = ScaledSheet.create({
	infoWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconWrap: {
		minWidth: '25@s',
	}
})