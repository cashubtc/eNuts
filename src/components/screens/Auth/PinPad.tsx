import { BackspaceIcon, CheckmarkIcon } from '@comps/Icons'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const white = '#FAFAFA'
const grey = '#999'
const padBgColor = '#73BD88'

// the number pad data where 10 is "backspace" and 11 is "submit"
const pad = [
	[{ n: 1 }, { n: 2, t: 'ABC' }, { n: 3, t: 'DEF' }],
	[{ n: 4, t: 'GHI' }, { n: 5, t: 'JKL' }, { n: 6, t: 'MNO' }],
	[{ n: 7, t: 'PQRS' }, { n: 8, t: 'TUV' }, { n: 9, t: 'WXYZ' }],
	[{ n: 10 }, { n: 0 }, { n: 11 }],
]

interface IPinPadProps {
	pinInput: number[]
	confirmInput: number[]
	confirm: boolean
	handleInput: (val: number) => Promise<void>
}

export default function PinPad({ pinInput, confirmInput, confirm, handleInput }: IPinPadProps) {
	// should pad input be disabled
	const shouldDisablePad = (val: number) => (
		shouldDisableSubmit(val) ||
		// disable backspace button in input is empty
		(!pinInput.length && val === 10 && !confirm) ||
		// disable backspace button in confirm input is empty
		(!confirmInput.length && val === 10 && confirm) ||
		// disable pad number buttons if any input (initial or confirm) >= 12
		(pinInput.length >= 12 && val !== 10 && val !== 11 && !confirm) ||
		(confirmInput.length >= 12 && val !== 10 && val !== 11 && confirm)
	)
	// should submit be disabled
	const shouldDisableSubmit = (val: number) => (
		val === 11 && (
			(!confirm && pinInput.length < 4) ||
			(confirm && confirmInput.length < 4)
		)
	)
	return (
		<>
			{pad.map((row, i) => (
				<View key={i} style={styles.numberRow}>
					{row.map(pad => (
						<TouchableOpacity
							key={`${i}${pad.n}`}
							onPress={() => void handleInput(pad.n)}
							style={[styles.numWrap, pad.n < 10 ? { backgroundColor: padBgColor } : {}]}
							disabled={shouldDisablePad(pad.n)}
						>
							{pad.n === 10 ? <BackspaceIcon width={32} height={32} color={white} /> // backspace
								: pad.n === 11 ? <CheckmarkIcon width={32} height={32} color={shouldDisableSubmit(pad.n) ? grey : white} /> // submit
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
		</>
	)
}

const styles = StyleSheet.create({
	numberRow: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-evenly',
		marginVertical: 10,
	},
	numWrap: {
		width: 70,
		height: 70,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 35,
	},
	num: {
		fontSize: 28,
		fontWeight: '300',
		color: white,
	},
	char: {
		fontSize: 10,
		color: white,
		marginTop: -5,
	},
})