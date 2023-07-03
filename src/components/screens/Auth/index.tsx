import { BackspaceIcon, CheckmarkIcon, LockIcon } from '@comps/Icons'
import { ThemeContext } from '@src/context/Theme'
import { l } from '@src/logger'
import type { TAuthPageProps } from '@src/model/nav'
import { vib } from '@src/util'
import { globals, highlight as hi } from '@styles'
import { useContext, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

// the number pad data where 10 is "backspace" and 11 is "submit"
const pad = [
	[{ n: 1 }, { n: 2, t: 'ABC' }, { n: 3, t: 'DEF' }],
	[{ n: 4, t: 'GHI' }, { n: 5, t: 'JKL' }, { n: 6, t: 'MNO' }],
	[{ n: 7, t: 'PQRS' }, { n: 8, t: 'TUV' }, { n: 9, t: 'WXYZ' }],
	[{ n: 10 }, { n: 0 }, { n: 11 }],
]

export default function AuthPage({ navigation }: TAuthPageProps ) {
	// TODO check if user should setup PIN or login with his PIN
	const { color, highlight } = useContext(ThemeContext)
	// PIN input state
	const [input, setInput] = useState<number[]>([])
	// handle pad press
	const handleInput = (val: number) => {
		// disable number pad once PIN has 4 digit
		if (input.length === 4 && val !== 10 && val !== 11) { return }
		// vibrate 25ms
		vib(25)
		// handle delete
		if (val === 10) {
			setInput(prev => prev.slice(0, -1))
			return
		}
		// handle submit
		if (val === 11) {
			// TODO 1: submit - 2: confirm PIN - 3: store hash of PIN and redirect to dashboard
			l(`submit input ${input.join('')}`)
			// TODO handle wrong submit and activate a lock countdown after N wrong attempts
			return
		}
		setInput(prev => [...prev, val])
	}
	const handleSkip = () => {
		// TODO store a boolean to remember that user skipped to avoid rendering this page on next start
		navigation.navigate('dashboard')
	}
	return (
		/* this is the initial pin setup page */
		<View style={[styles.container, { backgroundColor: hi[highlight] }]}>
			<View style={styles.lockWrap}>
				<LockIcon width={40} height={40} color='#FAFAFA' />
			</View>
			<View style={styles.bottomSection}>
				{input.length > 0 ?
					/* hidden pin after input */
					<View style={[styles.pinWrap, { width: 25 * input.length }]}>
						{input.map((_n, i) => <View key={i} style={styles.pinCircle} />)}
					</View>
					:
					<>
						{/* initial welcome on empty input // TODO update text content if user is logging in */}
						<Text style={styles.welcome}>
							Welcome
						</Text>
						<Text style={styles.txt}>
							You can setup a PIN to secure your app.
						</Text>
					</>
				}
				{/* number pad */}
				<View>
					{pad.map((row, i) => (
						<View key={i} style={styles.numberRow}>
							{row.map(pad => (
								<TouchableOpacity
									key={`${i}${pad.n}`}
									onPress={() => handleInput(pad.n)}
									style={pad.n < 10 ? styles.numWrap : styles.iconWrap}
									disabled={(pad.n === 11 && input.length < 4) || (pad.n < 10 && input.length === 4) || (pad.n === 10 && !input.length)}
								>
									{pad.n === 10 ? <BackspaceIcon width={32} height={32} color='#FAFAFA' /> // backspace
										: pad.n === 11 ? <CheckmarkIcon width={32} height={32} color={input.length < 4 ? '#999' : '#FAFAFA'} /> // submit
											: // number pads
											<>
												<Text style={styles.num}>
													{pad.n}
												</Text>
												{pad.t &&
													<Text style={styles.char}>
														{pad.t}
													</Text>
												}
											</>
									}
								</TouchableOpacity>
							))}
						</View>
					))}
					{/* skip // TODO hide this if user is logging in - Provide a "back" button on PIN confirm state */}
					<TouchableOpacity onPress={handleSkip}>
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
	pinWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-around',
		marginVertical: 40
	},
	pinCircle: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: '#FAFAFA'
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
		width: 70,
		height: 70,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 35,
	},
	iconWrap: {
		width: 70,
		height: 70,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 35,
	},
	num: {
		fontSize: 28,
		fontWeight: '300',
		color: '#FAFAFA',
	},
	char: {
		fontSize: 10,
		color: '#FAFAFA',
		marginTop: -5,
	},
	skip: {
		color: '#FAFAFA',
		paddingTop: 20,
		paddingBottom: 10,
	}
})