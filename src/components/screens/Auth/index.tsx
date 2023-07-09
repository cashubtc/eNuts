import { useShakeAnimation } from '@comps/animation/Shake'
import { LockIcon, UnlockIcon } from '@comps/Icons'
import { MinuteInS } from '@consts/time'
import type { TAuthPageProps } from '@model/nav'
import { PinCtx } from '@src/context/Pin'
import { ThemeContext } from '@src/context/Theme'
import { secureStore,store } from '@store'
import { globals, highlight as hi } from '@styles'
import { formatSeconds, vib } from '@util'
import { hash256 } from '@util/crypto'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import PinHint from './Hint'
import PinDots from './PinDots'
import PinPad from './PinPad'

export default function AuthPage({ navigation, route }: TAuthPageProps) {
	const { shouldAuth, shouldEdit, shouldRemove } = route.params
	const { t } = useTranslation()
	const { anim, shake } = useShakeAnimation()
	const { color, highlight } = useContext(ThemeContext)
	// PIN mismatch context
	const { attempts, setAttempts } = useContext(PinCtx)
	// auth state
	const [auth, setAuth] = useState(shouldAuth)
	// initial PIN input state
	const [pinInput, setPinInput] = useState<number[]>([])
	// confirm PIN input state
	const [confirmInput, setConfirmInput] = useState<number[]>([])
	// PIN confirm
	const [isConfirm, setIsConfirm] = useState(false)
	const [success, setSuccess] = useState(false)
	const resetStates = () => {
		setPinInput([])
		setConfirmInput([])
		setIsConfirm(false)
	}
	// backspace handler
	const handleDelete = () => {
		// handle delete the confirmation pin input
		if (isConfirm) {
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
		if (!isConfirm) {
			await store.setObj('auth:lock', { ...attemptState, timestamp: Math.ceil(Date.now() / 1000) })
		}
		setAttempts(attemptState)
		// reset mismatch state
		const t = setTimeout(() => {
			// if user fails confirming pin after 3 attemps, reset back to initial setup
			setConfirmInput([])
			if (isConfirm && maxMismatchCount) {
				setPinInput([])
				setIsConfirm(false)
			}
			// Reset pin input
			if (auth.length) { setPinInput([]) }
			setAttempts(prev => ({
				...prev,
				mismatch: false,
				locked: isConfirm ? false : prev.locked
			}))
			clearTimeout(t)
		}, 1000)
	}
	// pin submit handler
	const handleSubmit = async () => {
		// user has setup a pin previously
		if (auth.length) {
			// user is providing a wrong pin
			if (hash256(pinInput.join('')) !== auth) {
				await handlePinMismatch()
				return
			}
			// user wants to delete his PIN
			if (shouldRemove) {
				await Promise.all([
					secureStore.delete('auth:pin'),
					store.set('auth:skipped', '1')
				])
				setAuth('')
			}
			// remove the lock data and authbg in storage
			await Promise.all([
				store.delete('auth:lock'),
				store.delete('auth:bg')
			])
			resetStates()
			// User wants to edit his PIN, do not navigate away, just update the state as he had no PIN so he can enter a new PIN
			if (shouldEdit) {
				setAuth('')
				return
			}
			setSuccess(true)
			// navigate to dashboard
			navigation.navigate(shouldRemove ? 'Security settings' : 'dashboard')
			return
		}
		// user is submitting a pin confirmation
		if (isConfirm) {
			const pinStr = pinInput.join('')
			// mismatch while confirming pin
			if (pinStr !== confirmInput.join('')) {
				await handlePinMismatch()
				return
			}
			// else: PIN confirm is matching
			const hash = hash256(pinStr)
			await Promise.all([
				secureStore.set('auth:pin', hash),
				store.delete('auth:lock')
			])
			resetStates()
			setSuccess(true)
			setAuth(hash)
			navigation.navigate(shouldEdit ? 'Security settings' : 'dashboard')
			return
		}
		// else: bring user in the confirm state after entering his first pin in setup
		setIsConfirm(true)
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
		if (isConfirm) {
			setConfirmInput(prev => [...prev, val])
			return
		}
		// set pin input
		setPinInput(prev => [...prev, val])
	}
	// skip pin setup || go back from confirm state to initial pin setup
	const handleSkip = async () => {
		if (isConfirm) {
			setIsConfirm(false)
			setConfirmInput([])
			setPinInput([])
			return
		}
		// skip pin setup
		await store.set('auth:skipped', '1')
		navigation.navigate('dashboard')
	}
	// conditional rendering dots of pin input
	const shouldShowPinSection = () => (
		(pinInput.length > 0 && !isConfirm) ||
		(isConfirm && confirmInput.length > 0)
	)
	// handle locked time
	useEffect(() => {
		if (!attempts.locked || isConfirm) { return }
		if (attempts.lockedTime <= 0) {
			setAttempts(prev => ({ ...prev, locked: false }))
			return
		}
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
	// handle pin state
	useEffect(() => {
		setAuth(shouldAuth)
	}, [shouldAuth])
	// reset success state after navigating to this screen
	useEffect(() => {
		const focusHandler = navigation.addListener('focus', () => setSuccess(false))
		return focusHandler
	}, [navigation])
	return (
		/* this is the initial pin setup page */
		<View style={[styles.container, { backgroundColor: hi[highlight], justifyContent: success ? 'center' : 'space-between' }]}>
			{success ?
				<UnlockIcon width={40} height={40} color='#FAFAFA' />
				:
				<>
					{attempts.locked && !isConfirm && <View />}
					<View style={attempts.locked && !isConfirm ? { alignItems: 'center' } : styles.lockWrap}>
						<Animated.View style={attempts.locked ? { transform: [{ translateX: anim.current }] } : {}}>
							<LockIcon width={40} height={40} color={attempts.locked ? color.ERROR : '#FAFAFA'} />
						</Animated.View>
						{attempts.locked && !isConfirm &&
							<Text style={styles.lockedTime}>
								{formatSeconds(attempts.lockedTime)}
							</Text>
						}
					</View>
					{attempts.locked && !isConfirm ?
						<View />
						:
						<View style={styles.bottomSection}>
							{attempts.mismatch &&
								<Text style={[styles.mismatch, { color: color.ERROR }]}>
									{t('auth.pinMismatch')}
								</Text>
							}
							{shouldShowPinSection() ?
								<Animated.View style={{ transform: [{ translateX: anim.current }] }}>
									<PinDots mismatch={attempts.mismatch} input={isConfirm ? confirmInput : pinInput} />
								</Animated.View>
								:
								<PinHint
									confirm={isConfirm}
									login={auth.length > 0}
									shouldEdit={shouldEdit}
									shouldRemove={shouldRemove}
								/>
							}
							{/* number pad */}
							<View>
								<PinPad
									pinInput={pinInput}
									confirmInput={confirmInput}
									isConfirm={isConfirm}
									mismatch={attempts.mismatch}
									handleInput={handleInput}
								/>
								{/* skip or go back from confirm */}
								{!auth.length && !shouldEdit &&
									<TouchableOpacity onPress={() => void handleSkip()}>
										<Text style={[globals(color).pressTxt, styles.skip]}>
											{isConfirm ? t('common.back') : t('willDoLater')}
										</Text>
									</TouchableOpacity>
								}
								{(((shouldRemove || shouldEdit) && auth.length > 0) || (shouldEdit && !auth.length)) &&
									<TouchableOpacity onPress={() => {
										resetStates()
										navigation.navigate('Security settings')
									}}>
										<Text style={[globals(color).pressTxt, styles.skip]}>
											{t('common.cancel')}
										</Text>
									</TouchableOpacity>
								}
							</View>
						</View>
					}
				</>
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