import { ZapIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { useContext } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export default function Lud({ lud16, lud06 }: { lud16?: string, lud06?: string }) {
	const { highlight } = useContext(ThemeContext)
	const handleLud = () => {
		// href={nip05toURL(nip05)}
	}
	return (
		<>
			{lud16 || lud06 ?
				<View style={styles.infoWrap}>
					<View style={styles.iconWrap}>
						<ZapIcon width={22} height={22} color={hi[highlight]} />
					</View>
					<TouchableOpacity onPress={handleLud}>
						<Txt
							txt={(lud16 || lud06)?.substring(0, 50) || ''}
							styles={[{ color: hi[highlight], paddingBottom: 3 }]}
						/>
					</TouchableOpacity>
				</View>
				:
				null}
		</>
	)
}

const styles = StyleSheet.create({
	infoWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconWrap: {
		minWidth: 25,
		marginTop: 3
	}
})