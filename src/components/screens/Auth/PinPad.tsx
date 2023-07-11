import { BackspaceIcon, CheckmarkIcon } from '@comps/Icons'
import { ThemeContext } from '@src/context/Theme'
import { getPinpadBg, highlight as hi } from '@styles/colors'
import { useContext } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const white = '#FAFAFA'
const grey = '#999'

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
	isConfirm: boolean
	mismatch: boolean
	handleInput: (val: number) => Promise<void>
}

export default function PinPad({ pinInput, confirmInput, isConfirm, mismatch, handleInput }: IPinPadProps) {
	const { highlight } = useContext(ThemeContext)
	// should pad input be disabled
	const shouldDisablePad = (val: number) => (
		mismatch ||
		// disable submit button on too low input
		(val === 11 && shouldDisableSubmit()) ||
		// disable backspace button if pin input is empty
		(!pinInput.length && val === 10 && !isConfirm) ||
		// disable backspace button in confirm input is empty
		(!confirmInput.length && val === 10 && isConfirm) ||
		// disable pad number buttons if any input (initial or confirm) >= 12
		(pinInput.length >= 12 && val !== 10 && val !== 11 && !isConfirm) ||
		(confirmInput.length >= 12 && val !== 10 && val !== 11 && isConfirm)
	)
	// should submit be disabled
	const shouldDisableSubmit = () => (
		(!isConfirm && pinInput.length < 4) ||
		(isConfirm && confirmInput.length < 4)
	)
	return (
		<>
			{pad.map((row, i) => (
				<View key={i} style={styles.numberRow}>
					{row.map(pad => (
						<TouchableOpacity
							key={`${i}${pad.n}`}
							onPress={() => void handleInput(pad.n)}
							style={[styles.numWrap, pad.n < 10 ? { backgroundColor: getPinpadBg(hi[highlight]) } : {}]}
							disabled={shouldDisablePad(pad.n)}
						>
							{pad.n === 10 ? <BackspaceIcon width={32} height={32} color={white} /> // backspace
								: pad.n === 11 ? <CheckmarkIcon width={32} height={32} color={shouldDisableSubmit() ? grey : white} /> // submit
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
		fontSize: 8,
		color: white,
		marginTop: -5,
	},
})