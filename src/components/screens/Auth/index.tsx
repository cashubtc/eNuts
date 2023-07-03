import { BackspaceIcon, CheckmarkIcon, LockIcon } from '@comps/Icons'
import { ThemeContext } from '@src/context/Theme'
import { l } from '@src/logger'
import { vib } from '@src/util'
import { globals, highlight as hi } from '@styles'
import { useContext, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function AuthPage() {
	const { color, highlight } = useContext(ThemeContext)
	const [input, setInput] = useState<number[]>([])
	const handleInput = (val: number) => {
		if (input.length === 4) { return }
		vib(25)
		// handle delete -> val === 10
		if (val === 10) {
			setInput(prev => (prev.slice(0, -1)))
			l({ input })
			return
		}
		// handle submit -> val === 11
		setInput([...input, val])
		l({ input })
	}
	return (
		/* this is the initial pin setup page */
		<View style={[styles.container, { backgroundColor: hi[highlight] }]}>
			<View style={styles.lockWrap}>
				<LockIcon width={40} height={40} color='#FAFAFA' />
			</View>
			<View style={styles.bottomSection}>
				<Text style={styles.welcome}>
					Welcome
				</Text>
				<Text style={styles.txt}>
					You can setup a PIN to secure your app.
				</Text>
				<View>
					{/* 1 - 2 - 3 */}
					<View style={styles.numberRow}>
						<TouchableOpacity
							onPress={() => handleInput(1)}
							style={styles.numWrap}
						>
							<Text style={styles.num}>
								1
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => handleInput(2)}
							style={styles.numWrap}
						>
							<Text style={styles.num}>
								2
							</Text>
							<Text></Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => handleInput(3)}
							style={styles.numWrap}
						>
							<Text style={styles.num}>
								3
							</Text>
						</TouchableOpacity>
					</View>
					{/* 4 - 5 - 6 */}
					<View style={styles.numberRow}>
						<TouchableOpacity
							onPress={() => handleInput(4)}
							style={styles.numWrap}
						>
							<Text style={styles.num}>
								4
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => handleInput(5)}
							style={styles.numWrap}
						>
							<Text style={styles.num}>
								5
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => handleInput(6)}
							style={styles.numWrap}
						>
							<Text style={styles.num}>
								6
							</Text>
						</TouchableOpacity>
					</View>
					{/* 7 - 8 - 9 */}
					<View style={styles.numberRow}>
						<TouchableOpacity
							style={styles.numWrap}
							onPress={() => handleInput(7)}
						>
							<Text style={styles.num}>
								7
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.numWrap}
							onPress={() => handleInput(8)}
						>
							<Text style={styles.num}>
								8
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.numWrap}
							onPress={() => handleInput(9)}
						>
							<Text style={styles.num}>
								9
							</Text>
						</TouchableOpacity>
					</View>
					{/* del - 0 - OK */}
					<View style={styles.numberRow}>
						<TouchableOpacity
							onPress={() => handleInput(10)}
						>
							<BackspaceIcon width={32} height={32} color='#FAFAFA' />
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => handleInput(0)}
							style={styles.numWrap}
						>
							<Text style={styles.num}>
								0
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => handleInput(11)}
							disabled
						>
							<CheckmarkIcon width={32} height={32} color='#FAFAFA' />
						</TouchableOpacity>
					</View>
					{/* skip */}
					<TouchableOpacity>
						<Text style={[globals(color).pressTxt, styles.skip]}>
							Will do later
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingTop: 20,
		paddingHorizontal: 20,
	},
	lockWrap: {
		marginTop: 60,
	},
	bottomSection: {
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 20,
	},
	welcome: {
		fontSize: 22,
		color: '#FAFAFA',
		marginVertical: 10,
	},
	txt: {
		fontSize: 14,
		color: '#FAFAFA',
		textAlign: 'center',
		marginBottom: 20,
	},
	numberRow: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-evenly',
		marginVertical: 10,
	},
	numWrap: {
		backgroundColor: '#73BD88',
		borderRadius: 50,
		paddingVertical: 13,
		paddingHorizontal: 25,
	},
	num: {
		fontSize: 28,
		fontWeight: '300',
		color: '#FAFAFA',
	},
	skip: {
		color: '#FAFAFA',
		paddingTop: 20,
		paddingBottom: 10,
	}
})