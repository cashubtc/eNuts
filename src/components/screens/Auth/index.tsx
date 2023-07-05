import { useShakeAnimation } from '@comps/animation/Shake'
import { BackspaceIcon, CheckmarkIcon, LockIcon } from '@comps/Icons'
import { MinuteInMs } from '@consts'
import { l } from '@log'
import type { TAuthPageProps } from '@model/nav'
import { ThemeContext } from '@src/context/Theme'
import { store } from '@store'
import { globals, highlight as hi } from '@styles'
import { formatSeconds, vib } from '@util'
import { useContext, useEffect, useState } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

// the number pad data where 10 is "backspace" and 11 is "submit"
const pad = [
	[{ n: 1 }, { n: 2, t: 'ABC' }, { n: 3, t: 'DEF' }],
	[{ n: 4, t: 'GHI' }, { n: 5, t: 'JKL' }, { n: 6, t: 'MNO' }],
	[{ n: 7, t: 'PQRS' }, { n: 8, t: 'TUV' }, { n: 9, t: 'WXYZ' }],
	[{ n: 10 }, { n: 0 }, { n: 11 }],
]

export default function AuthPage({ navigation }: TAuthPageProps) {
	const { anim, shake } = useShakeAnimation()
	// TODO check if user should setup PIN or login with his PIN
	const { color, highlight } = useContext(ThemeContext)
	// initial PIN input state
	const [pinInput, setPinInput] = useState<number[]>([])
	// confirm PIN input state
	const [confirmInput, setConfirmInput] = useState<number[]>([])
	// PIN confirm
	const [confirm, setConfirm] = useState(false)
	// PIN confirmation mismatch
	const [attempts, setAttempts] = useState({
		mismatch: false,
		mismatchCount: 0,
		locked: false,
		lockedCount: 0,
		lockedTime: 0,
	})
	// disable pad input
	const isNumPadDisabled = (val: number) => (
		(pinInput.length >= 12 && val !== 10 && val !== 11 && !confirm) ||
		(confirmInput.length >= 12 && val !== 10 && val !== 11 && confirm)
	)

	const isSubmitPadDisabled = () => (
		(!confirm && pinInput.length < 4) ||
		(confirm && confirmInput.length < 4)
	)

	// handle pad press
	const handleInput = (val: number) => {
		// TODO handle PIN login if user has setup a PIN
		if (isNumPadDisabled(val)) { return }
		// user can be in the confirmation state now
		// vibrate 25ms for pad touch
		vib(25)
		// handle delete
		if (val === 10) {
			// handle delete the confirmation pin input
			if (confirm) {
				setConfirmInput(prev => prev.slice(0, -1))
				return
			}
			// else: handle delete the initial pin input
			setPinInput(prev => prev.slice(0, -1))
			return
		}
		// handle submit
		if (val === 11) {
			// user is submitting a pin confirmation
			if (confirm) {
				// mismatch while confirming pin
				if (pinInput.join('') !== confirmInput.join('')) {
					// shake pin dots
					shake()
					// vibrate longer if locked activated
					vib(attempts.mismatchCount + 1 === 3 ? 1000 : 400)
					// TODO store this info to avoid bypass state on app restart
					setAttempts(prev => ({
						mismatch: true,
						mismatchCount: prev.mismatchCount + 1 === 3 ? 0 : prev.mismatchCount + 1,
						// lock input depending on wrong attempt count and locked count
						locked: prev.mismatchCount + 1 === 3,
						lockedCount: prev.mismatchCount + 1 === 3 ? prev.lockedCount + 1 : prev.lockedCount,
						lockedTime: MinuteInMs * (prev.lockedCount + 1) * (prev.lockedCount + 1) // 1min * 1 * 1 -> 1min * 2 * 2 -> ...
					}))
					// reset mismatch state
					const t = setTimeout(() => {
						setAttempts(prev => ({
							...prev,
							mismatch: false,
						}))
						setConfirmInput([])
						clearTimeout(t)
					}, 1000)
					return
				}
				// else: PIN are matching, hash and store the pin
				return // TODO store hash of PIN and redirect to dashboard
			}
			// bring user in the confirm state
			setConfirm(true)
			return
		}
		if (confirm) {
			setConfirmInput(prev => [...prev, val])
			return
		}
		setPinInput(prev => [...prev, val])
	}
	const handleSkip = async () => {
		if (confirm) {
			setConfirm(false)
			setConfirmInput([])
			setPinInput([])
			return
		}
		await store.set('pinSkipped', '1')
		navigation.navigate('dashboard')
	}
	const shouldShowPinSection = () => {
		if (pinInput.length > 0 && !confirm) { return true }
		if (confirm && confirmInput.length > 0) { return true }
		return false
	}
	// handle locked time
	useEffect(() => {
		if (!attempts.locked) { return }
		l({ timeLocked: attempts.lockedTime })
		const t = setInterval(() => {
			if (attempts.lockedTime <= 0) {
				clearInterval(t)
				setAttempts(prev => ({ ...prev, locked: false }))
				return
			}
			setAttempts(prev => ({ ...prev, lockedTime: prev.lockedTime - 1000 }))
		}, 1000)
		return () => clearInterval(t)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [attempts.locked, attempts.lockedTime])
	return (
		/* this is the initial pin setup page */
		<View style={[styles.container, { backgroundColor: hi[highlight] }]}>
			{attempts.locked && <View />}
			<View style={attempts.locked ? { alignItems: 'center' } : styles.lockWrap}>
				<LockIcon width={40} height={40} color={attempts.locked ? color.ERROR : '#FAFAFA'} />
				{attempts.locked &&
					<Text style={[styles.lockedTime, { color: color.ERROR }]}>
						{formatSeconds(attempts.lockedTime / 1000)}
					</Text>
				}
			</View>
			{attempts.locked ?
				<View />
				:
				<View style={styles.bottomSection}>
					{attempts.mismatch &&
						<Text style={[styles.mismatch, { color: color.ERROR }]}>
							PIN does not match!
						</Text>
					}
					{shouldShowPinSection() ?
						<Animated.View style={{ transform: [{ translateX: anim.current }] }}>
							<PinCode mismatch={attempts.mismatch} input={confirm ? confirmInput : pinInput} />
						</Animated.View>
						:
						<PinHint confirm={confirm} />
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
										disabled={isNumPadDisabled(pad.n)}
									>
										{pad.n === 10 ? <BackspaceIcon width={32} height={32} color='#FAFAFA' /> // backspace
											: pad.n === 11 ? <CheckmarkIcon width={32} height={32} color={isSubmitPadDisabled() ? '#999' : '#FAFAFA'} /> // submit
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
						{/* skip // TODO hide this if user is logging in */}
						<TouchableOpacity onPress={() => void handleSkip()}>
							<Text style={[globals(color).pressTxt, styles.skip]}>
								{confirm ? 'Back' : 'Will do later'}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			}
		</View>
	)
}

function PinHint({ confirm, login }: { confirm?: boolean, login?: boolean }) {
	return (
		<>
			{(login || !confirm) &&
				<Text style={styles.welcome}>
					Welcome{login ? ' back' : ''}
				</Text>
			}
			<Text style={styles.txt}>
				{!login && !confirm ?
					'You can setup a PIN to secure your app.'
					:
					`Please ${confirm ? 'confirm' : 'enter'} your PIN now.`
				}
			</Text>
		</>
	)
}

function PinCode({ input, mismatch }: { input: number[], mismatch?: boolean }) {
	const { color } = useContext(ThemeContext)
	return (
		<View style={[styles.pinWrap, { width: 25 * input.length }]}>
			{input.map((_n, i) => <View key={i} style={[styles.pinCircle, { backgroundColor: mismatch ? color.ERROR : '#FAFAFA' }]} />)}
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
	mismatch: {
		fontSize: 16,
		fontWeight: '500',
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
	},
	lockedTime: {
		fontSize: 24,
		marginTop: 20
	}
})