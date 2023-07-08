import { l } from '@log'
import { createContext, useEffect, useState } from 'react'

const usePin = () => {
	const [attempts, setAttempts] = useState({
		mismatch: false,
		mismatchCount: 0,
		locked: false,
		lockedCount: 0,
		lockedTime: 0,
	})
	useEffect(() => {
		l('testtttttttttttttt')
	}, [])
	return { attempts, setAttempts }
}

type usePinType = ReturnType<typeof usePin>

export const PinCtx = createContext<usePinType>({
	attempts: {
		mismatch: false,
		mismatchCount: 0,
		locked: false,
		lockedCount: 0,
		lockedTime: 0,
	},
	setAttempts: () => l(''),
})