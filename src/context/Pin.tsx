import { FiveMins } from '@consts/time'
import { l } from '@log'
import type { INavigatorProps } from '@model/nav'
import { secureStore, store } from '@store'
import { SECURESTORE_KEY, STORE_KEYS } from '@store/consts'
import { isNull, isStr } from '@util'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'

interface ILockData {
	mismatch: boolean
	mismatchCount: number
	locked: boolean
	lockedCount: number
	lockedTime: number,
	timestamp: number
}

const usePin = () => {
	// back-foreground state reference
	const appState = useRef(AppState.currentState)
	const [auth, setAuth] = useState<INavigatorProps>({
		shouldSetup: false,
		pinHash: ''
	})
	const [attempts, setAttempts] = useState({
		mismatch: false,
		mismatchCount: 0,
		locked: false,
		lockedCount: 0,
		lockedTime: 0,
	})
	// app was longer than 5 mins in the background
	const [bgAuth, setBgAuth] = useState(false)
	const handlePinForeground = async () => {
		// check if app is locked
		const now = Math.ceil(Date.now() / 1000)
		const lockData = await store.getObj<ILockData>(STORE_KEYS.lock)
		if (lockData) {
			// set state acccording to lockData timestamp
			const secsPassed = now - lockData.timestamp
			const lockedTime = lockData.lockedTime - secsPassed
			setAttempts({
				...lockData,
				mismatch: false,
				lockedTime
			})
		}
		// handle app was longer than 5 mins in the background
		const bgTimestamp = await store.get(STORE_KEYS.bgCounter)
		if (isStr(bgTimestamp) && bgTimestamp.length > 0) {
			if (now - +bgTimestamp > FiveMins) {
				setBgAuth(true)
			}
		}
	}
	// init
	useEffect(() => {
		void (async () => {
			const [pinHash, shouldSetup] = await Promise.all([
				secureStore.get(SECURESTORE_KEY),
				store.get(STORE_KEYS.pinSkipped),
			])
			setAuth({
				pinHash: isNull(pinHash) ? '' : pinHash,
				shouldSetup: !isStr(shouldSetup) || !shouldSetup?.length
			})
			// check for pin attempts and app locked state
			await handlePinForeground()
			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			const subscription = AppState.addEventListener('change', async nextAppState => {
				if (
					appState.current.match(/inactive|background/) &&
					nextAppState === 'active'
				) {
					l('(PIN context) App has come to the foreground!')
					// check for pin attempts and app locked state
					await handlePinForeground()
				} else {
					l('(PIN context) App has gone to the background!')
					// store timestamp to activate auth after > 5mins in background
					await store.set(STORE_KEYS.bgCounter, `${Math.ceil(Date.now() / 1000)}`)
				}
				appState.current = nextAppState
			})
			return () => subscription.remove()
		})()
	}, [])
	return {
		auth,
		setAuth,
		attempts,
		setAttempts,
		bgAuth,
		setBgAuth,
		handlePinForeground
	}
}

type usePinType = ReturnType<typeof usePin>

const PinCtx = createContext<usePinType>({
	auth: {
		shouldSetup: false,
		pinHash: ''
	},
	setAuth: () => l(''),
	attempts: {
		mismatch: false,
		mismatchCount: 0,
		locked: false,
		lockedCount: 0,
		lockedTime: 0,
	},
	setAttempts: () => l(''),
	bgAuth: false,
	setBgAuth: () => l(''),
	// eslint-disable-next-line @typescript-eslint/await-thenable, no-return-await
	handlePinForeground: async () => await l('')
})

export const usePinContext = () => useContext(PinCtx)

export const PinProvider = ({ children }: { children: React.ReactNode }) => (
	<PinCtx.Provider value={usePin()} >
		{children}
	</PinCtx.Provider>
)
