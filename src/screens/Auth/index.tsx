import { useShakeAnimation } from '@comps/animation/Shake'
import { TxtButton } from '@comps/Button'
import { LockIcon, UnlockIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { MinuteInS } from '@consts/time'
import type { TAuthPageProps } from '@model/nav'
import { PinCtx } from '@src/context/Pin'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { secureStore, store } from '@store'
import { SECURESTORE_KEY, STORE_KEYS } from '@store/consts'
import { highlight as hi, mainColors } from '@styles'
import { formatSeconds, vib } from '@util'
import { hash256 } from '@util/crypto'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, SafeAreaView, StyleSheet, Text, View } from 'react-native'

import PinHint from './Hint'
import PinDots from './PinDots'
import PinPad from './PinPad'

export default function AuthPage({ navigation, route }: TAuthPageProps) {
	const { pinHash, shouldEdit, shouldRemove } = route.params
	const { t } = useTranslation([NS.common])
	const { anim, shake } = useShakeAnimation()
	const { highlight } = useThemeContext()
	// PIN mismatch context
	const { attempts, setAttempts } = useContext(PinCtx)
	// auth state
	const [auth, setAuth] = useState(pinHash)
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
		if (maxMismatchCount) {
			vib(500)
		}
		const attemptState = {
			mismatch: true,
			mismatchCount: maxMismatchCount ? 0 : attempts.mismatchCount + 1,
			locked: maxMismatchCount,
			lockedCount: maxMismatchCount ? increasedLockedCount : attempts.lockedCount,
			lockedTime: MinuteInS * Math.pow(increasedLockedCount, 2) // 1min * 1 * 1 -> 1min * 2 * 2 -> ...
		}
		// store this info to avoid bypass state on app restart
		if (!isConfirm) {
			await store.setObj(STORE_KEYS.lock, { ...attemptState, timestamp: Math.ceil(Date.now() / 1000) })
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
					secureStore.delete(SECURESTORE_KEY),
					store.set(STORE_KEYS.pinSkipped, '1')
				])
				setAuth('')
			}
			// remove the lock data and authbg in storage
			await Promise.all([
				store.delete(STORE_KEYS.lock),
				store.delete(STORE_KEYS.bgCounter)
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
				secureStore.set(SECURESTORE_KEY, hash),
				store.delete(STORE_KEYS.lock)
			])
			resetStates()
			setSuccess(true)
			setAuth(hash)
			await handleExplainer()
			return
		}
		// else: bring user in the confirm state after entering his first pin in setup
		setIsConfirm(true)
	}
	// handle pad press
	const handleInput = async (val: number) => {
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
		await store.set(STORE_KEYS.pinSkipped, '1')
		// check if initial explainer has been viewed
		await handleExplainer()

	}
	// handle explainer step
	const handleExplainer = async () => {
		// check if initial explainer has been viewed
		const explainer = await store.get(STORE_KEYS.explainer)
		if (explainer && explainer === '1') {
			navigation.navigate(shouldEdit ? 'Security settings' : 'dashboard')
			return
		}
		// show explainer
		navigation.navigate('explainer')
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
		setAuth(pinHash)
	}, [pinHash])
	// reset success state after navigating to this screen
	useEffect(() => {
		const focusHandler = navigation.addListener('focus', () => setSuccess(false))
		return focusHandler
	}, [navigation])
	return (
		/* this is the initial pin setup page */
		<SafeAreaView
			style={[
				styles.container,
				{
					backgroundColor: attempts.locked ? mainColors.ERROR : hi[highlight],
					justifyContent: success ? 'center' : 'space-between'
				}
			]}
		>
			{success ?
				<UnlockIcon width={40} height={40} color={mainColors.WHITE} />
				:
				<>
					{attempts.locked && !isConfirm && <View />}
					<View style={styles.lockWrap}>
						<Animated.View style={attempts.locked ? { transform: [{ translateX: anim.current }] } : {}}>
							<LockIcon width={40} height={40} color={mainColors.WHITE} />
						</Animated.View>
						{!shouldEdit && !shouldRemove && auth.length > 0 &&
							<Txt txt={t('walletLocked')} styles={[styles.lockTxt]} />
						}
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
								<Text style={[styles.mismatch, { color: mainColors.ERROR }]}>
									{t('pinMismatch', { ns: NS.auth })}
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
									<TxtButton
										txt={isConfirm ? t('back') : t('willDoLater')}
										onPress={() => void handleSkip()}
										style={[styles.skip]}
										txtColor={mainColors.WHITE}
									/>
								}
								{(((shouldRemove || shouldEdit) && auth.length > 0) || (shouldEdit && !auth.length)) &&
									<TxtButton
										txt={t('cancel')}
										onPress={() => {
											resetStates()
											navigation.navigate('Security settings')
										}}
										style={[styles.skip]}
										txtColor={mainColors.WHITE}
									/>
								}
							</View>
						</View>
					}
				</>
			}
		</SafeAreaView>
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
		alignItems: 'center',
		marginTop: 60,
	},
	lockTxt: {
		marginTop: 10,
		marginBottom: 20,
		fontWeight: '500',
		color: mainColors.WHITE
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
		paddingTop: 20,
		paddingBottom: 10,
	},
	lockedTime: {
		fontSize: 24,
		color: mainColors.WHITE
	}
})