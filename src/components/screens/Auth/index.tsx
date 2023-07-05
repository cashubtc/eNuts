import { useShakeAnimation } from '@comps/animation/Shake'
import { LockIcon, UnlockIcon } from '@comps/Icons'
import Loading from '@comps/Loading'
import { MinuteInS } from '@consts/time'
import type { TAuthPageProps } from '@model/nav'
import { ThemeContext } from '@src/context/Theme'
import { AsyncStore, secureStore, store } from '@store'
import { globals, highlight as hi } from '@styles'
import { formatSeconds, isNull, vib } from '@util'
import { hash256 } from '@util/crypto'
import { useContext, useEffect, useState } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import PinHint from './Hint'
import PinDots from './PinDots'
import PinPad from './PinPad'

interface ILockData {
	mismatch: boolean
	mismatchCount: number
	locked: boolean
	lockedCount: number
	lockedTime: number,
	timestamp: number
}

export default function AuthPage({ navigation }: TAuthPageProps) {
	const { anim, shake } = useShakeAnimation()
	const { color, highlight } = useContext(ThemeContext)
	// should login or initial pin setup
	const [hash, setHash] = useState<string | null>(null)
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
	const [success, setSuccess] = useState(false)
	// backspace handler
	const handleDelete = () => {
		// handle delete the confirmation pin input
		if (confirm) {
			setConfirmInput(prev => prev.slice(0, -1))
			return
		}
		// else: handle delete the initial pin input
		setPinInput(prev => prev.slice(0, -1))
	}
	// pin mismatch handler
	const handlePinMismatch = async () => {
		// shake pin dots
		shake()
		const maxMismatchCount = attempts.mismatchCount + 1 === 3
		const increasedLockedCount = attempts.lockedCount + 1
		// vibrate longer if locked activated
		vib(maxMismatchCount ? 1000 : 400)
		const attemptState = {
			mismatch: true,
			mismatchCount: maxMismatchCount ? 0 : attempts.mismatchCount + 1,
			locked: maxMismatchCount,
			lockedCount: maxMismatchCount ? increasedLockedCount : attempts.lockedCount,
			lockedTime: MinuteInS * Math.pow(increasedLockedCount, 2) // 1min * 1 * 1 -> 1min * 2 * 2 -> ...
		}
		// store this info to avoid bypass state on app restart
		if (!confirm) {
			await AsyncStore.setObj('lock', { ...attemptState, timestamp: Math.ceil(Date.now() / 1000) })
		}
		setAttempts(attemptState)
		// reset mismatch state
		const t = setTimeout(() => {
			// if user fails confirming pin after 3 attemps, reset back to initial setup
			setConfirmInput([])
			if (confirm && maxMismatchCount) {
				setPinInput([])
				setConfirm(false)
			}
			// hash is available === login state. Reset pin input
			if (hash?.length) { setPinInput([]) }
			setAttempts(prev => ({
				...prev,
				mismatch: false,
				locked: confirm ? false : prev.locked
			}))
			clearTimeout(t)
		}, 1000)
	}
	// pin submit handler
	const handleSubmit = async () => {
		// user has setup a pin previously
		if (hash?.length) {
			// user is providing a wrong pin
			if (hash256(pinInput.join('')) !== hash) {
				await handlePinMismatch()
				return
			}
			// remove the lock data in storage
			await AsyncStore.delete('lock')
			// else: navigate to dashboard
			navigation.navigate('dashboard')
			return
		}
		// user is submitting a pin confirmation
		if (confirm) {
			const pinStr = pinInput.join('')
			// mismatch while confirming pin
			if (pinStr !== confirmInput.join('')) {
				await handlePinMismatch()
				return
			}
			// else: PIN confirm is matching
			setSuccess(true)
			setPinInput([])
			setConfirmInput([])
			const hash = hash256(pinStr)
			await secureStore.set('pin', hash)
			// remove the lock data in storage
			await AsyncStore.delete('lock')
			navigation.navigate('dashboard')
			return
		}
		// else: bring user in the confirm state after entering his first pin in setup
		setConfirm(true)
	}
	// handle pad press
	const handleInput = async (val: number) => {
		// vibrate 25ms per pad touch
		vib(25)
		// backspace
		if (val === 10) {
			handleDelete()
			return
		}
		// submit pin
		if (val === 11) {
			await handleSubmit()
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
	// init
	useEffect(() => {
		void (async () => {
			// check if app is locked
			const lockData = await AsyncStore.getObj<ILockData>('lock')
			if (lockData?.locked) {
				// set state acccording to lockData timestamp
				const now = Math.ceil(Date.now() / 1000)
				const secsPassed = now - lockData.timestamp
				const lockedTime = lockData.lockedTime - secsPassed
				setAttempts({
					mismatch: false,
					mismatchCount: lockData.mismatchCount,
					locked: lockedTime > 0,
					lockedCount: lockData.lockedCount,
					lockedTime
				})
			}
			// check if a pin has been saved
			const pinHash = await secureStore.get('pin')
			setHash(isNull(pinHash) ? '' : pinHash)
		})()
	}, [])
	// handle locked time
	useEffect(() => {
		if (!attempts.locked || confirm) { return }
		const t = setInterval(() => {
			if (attempts.lockedTime <= 0) {
				clearInterval(t)
				setAttempts(prev => ({ ...prev, locked: false }))
				return
			}
			setAttempts(prev => ({ ...prev, lockedTime: prev.lockedTime - 1 }))
		}, 1000)
		return () => clearInterval(t)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [attempts.locked, attempts.lockedTime])
	// loading
	if (isNull(hash)) {
		return (
			<View style={[styles.loadingContainer, { backgroundColor: hi[highlight] }]}>
				<Loading white />
			</View>
		)
	}
	return (
		/* this is the initial pin setup page */
		<View style={[styles.container, { backgroundColor: hi[highlight] }]}>
			{attempts.locked && !confirm && <View />}
			<View style={attempts.locked && !confirm ? { alignItems: 'center' } : styles.lockWrap}>
				{success ?
					<UnlockIcon width={40} height={40} color={attempts.locked && !confirm ? color.ERROR : '#FAFAFA'} />
					:
					<Animated.View style={attempts.locked ? { transform: [{ translateX: anim.current }] } : {}}>
						<LockIcon width={40} height={40} color={attempts.locked ? color.ERROR : '#FAFAFA'} />
					</Animated.View>
				}
				{attempts.locked && !confirm &&
					<Text style={styles.lockedTime}>
						{formatSeconds(attempts.lockedTime)}
					</Text>
				}
			</View>
			{attempts.locked && !confirm ?
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
						<PinHint confirm={confirm} login={hash.length > 0} />
					}
					{/* number pad */}
					<View>
						<PinPad
							pinInput={pinInput}
							confirmInput={confirmInput}
							confirm={confirm}
							handleInput={handleInput}
						/>
						{/* skip or go back from confirm */}
						{!hash.length &&
							<TouchableOpacity onPress={() => void handleSkip()}>
								<Text style={[globals(color).pressTxt, styles.skip]}>
									{confirm ? 'Back' : 'Will do later'}
								</Text>
							</TouchableOpacity>
						}
					</View>
				</View>
			}
		</View>
	)
}

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
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
		marginTop: 20,
		color: '#FAFAFA'
	}
})