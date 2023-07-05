import { useShakeAnimation } from '@comps/animation/Shake'
import { LockIcon } from '@comps/Icons'
import { l } from '@log'
import type { TAuthPageProps } from '@model/nav'
import { ThemeContext } from '@src/context/Theme'
import { store } from '@store'
import { globals, highlight as hi } from '@styles'
import { formatSeconds, vib } from '@util'
import { useContext, useEffect, useState } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import PinHint from './Hint'
import PinDots from './PinDots'
import PinPad from './PinPad'

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
	const handleDelete = () => {
		// handle delete the confirmation pin input
		if (confirm) {
			setConfirmInput(prev => prev.slice(0, -1))
			return
		}
		// else: handle delete the initial pin input
		setPinInput(prev => prev.slice(0, -1))
	}
	const handleConfirmMismatch = () => {
		// shake pin dots
		shake()
		// vibrate longer if locked activated
		vib(attempts.mismatchCount + 1 === 3 ? 1000 : 400)
		// TODO store this info to avoid bypass state on app restart
		setAttempts(prev => ({
			...prev,
			mismatch: true,
			mismatchCount: prev.mismatchCount + 1 === 3 ? 0 : prev.mismatchCount + 1,
			// set to true after 3 failing confirmation, to bring user back to pin setup
			locked: prev.mismatchCount + 1 === 3,
			// lockedCount: prev.mismatchCount + 1 === 3 ? prev.lockedCount + 1 : prev.lockedCount,
			// lockedTime: MinuteInMs * (prev.lockedCount + 1) * (prev.lockedCount + 1) // 1min * 1 * 1 -> 1min * 2 * 2 -> ...
		}))
		// reset mismatch state
		const t = setTimeout(() => {
			// if user fails confirming pin after 3 attemps, reset back to initial setup
			if (attempts.locked) {
				setPinInput([])
				setConfirm(false)
			}
			setConfirmInput([])
			setAttempts(prev => ({
				...prev,
				mismatch: false,
				locked: false
			}))
			clearTimeout(t)
		}, 1000)
	}
	const handleSubmit = () => {
		// user is submitting a pin confirmation
		if (confirm) {
			// mismatch while confirming pin
			if (pinInput.join('') !== confirmInput.join('')) {
				handleConfirmMismatch()
				return
			}
			// else: PIN confirm is matching, // TODO hash & store the PIN and redirect to dashboard
			return
		}
		// bring user in the confirm state
		setConfirm(true)
	}
	// handle pad press
	const handleInput = (val: number) => {
		// TODO handle PIN login if user has setup a PIN
		// vibrate 25ms per pad touch
		vib(25)
		// backspace
		if (val === 10) {
			handleDelete()
			return
		}
		// submit pin
		if (val === 11) {
			handleSubmit()
			return
		}
		// set pin-confirm input on initial setup
		if (confirm) {
			setConfirmInput(prev => [...prev, val])
			return
		}
		// set pin input
		setPinInput(prev => [...prev, val])
	}
	// skip pin setup || go back from confirm state to initial pin setup
	const handleSkip = async () => {
		if (confirm) {
			setConfirm(false)
			setConfirmInput([])
			setPinInput([])
			return
		}
		// skip pin setup
		await store.set('pinSkipped', '1')
		navigation.navigate('dashboard')
	}
	// conditional rendering dots of pin input
	const shouldShowPinSection = () => (
		(pinInput.length > 0 && !confirm) ||
		(confirm && confirmInput.length > 0)
	)
	// TODO lock input on login depending on wrong attempt count and locked count

	// check if app is locked
	// if is not locked, just proceed normally
	// else
	// check when app has been locked exactly
	// calculate time in seconds since locked time
	// substract calculated time from locktime
	// if locktime <= 0 after calc, unlock
	// else keep locked and set remaining locktime

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
					<Text style={styles.lockedTime}>
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
							<PinDots mismatch={attempts.mismatch} input={confirm ? confirmInput : pinInput} />
						</Animated.View>
						:
						<PinHint confirm={confirm} />
					}
					{/* number pad */}
					<View>
						<PinPad
							pinInput={pinInput}
							confirmInput={confirmInput}
							confirm={confirm}
							handleInput={handleInput}
						/>
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
	mismatch: {
		fontSize: 16,
		fontWeight: '500',
		marginVertical: 10,
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