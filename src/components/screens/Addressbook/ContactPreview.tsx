import Txt from '@comps/Txt'
import type { HexKey } from '@model/nostr'
import { ThemeContext } from '@src/context/Theme'
import { useContext } from 'react'
import { useInView } from 'react-intersection-observer'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
// TODO delete this file
export default function ContactPreview({ pubkey }: { pubkey: HexKey }) {
	const { inView } = useInView({ triggerOnce: true })
	const { color } = useContext(ThemeContext)

	return (
		<View style={styles.bookEntry}>
			{inView &&
				<>
					<View
						style={[
							styles.circle,
							{ borderColor: color.BORDER, backgroundColor: color.INPUT_BG }
						]}
					>
						<Text style={{ color: color.TEXT, fontSize: 18 }}>
							T
						</Text>
					</View>
					<TouchableOpacity
						// style={styles.nameEntry}
						onPress={() => {
							// if (nav?.route.params?.isMelt) {
							// 	handleMelt(c.ln)
							// 	return
							// }
							// nav?.navigation.navigate('Contact', {
							// 	contact: c
							// })
						}}
					>
						<Txt txt='T' />
					</TouchableOpacity>
				</>
			}
		</View>
	)
}

const styles = StyleSheet.create({
	bookEntry: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 8,
	},
	circle: {
		borderWidth: 1,
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 20,
		marginVertical: 5,
		marginRight: 20,
	},
})