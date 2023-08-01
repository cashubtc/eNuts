import { VerifiedIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { useContext } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export default function NIP05Verified({ nip05 }: { nip05?: string }) {
	const { highlight } = useContext(ThemeContext)
	const handleNip05 = () => {
		// href={nip05toURL(nip05)}
	}
	return nip05 && nip05.split?.('@').length > 1 ?
		<View style={styles.infoWrap}>
			<View style={styles.iconWrap}>
				<VerifiedIcon width={18} height={18} color={hi[highlight]} />
			</View>
			<TouchableOpacity onPress={handleNip05}>
				<Txt
					txt={nip05.split('@')[0] === '_' ? nip05.split('@')[1] : nip05}
					styles={[{ color: hi[highlight], paddingBottom: 3 }]}
				/>
			</TouchableOpacity>
		</View>
		:
		null
}

const styles = StyleSheet.create({
	infoWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 20,
	},
	iconWrap: {
		minWidth: 25,
	}
})