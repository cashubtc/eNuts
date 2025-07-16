import { createContext, useContext, useEffect, useState } from 'react'
import { Keyboard } from 'react-native'

export function useKeyboard() {

	const [isKeyboardOpen, setIsOpen] = useState(false)

	const keyboardDidShow = () => setIsOpen(true)

	const keyboardDidHide = () => setIsOpen(false)

	useEffect(() => {
		Keyboard.addListener('keyboardDidShow', keyboardDidShow)
		Keyboard.addListener('keyboardDidHide', keyboardDidHide)
		return () => {
			Keyboard.removeAllListeners('keyboardDidShow')
			Keyboard.removeAllListeners('keyboardDidHide')
		}
	}, [])

	return { isKeyboardOpen }
}

type useKeyboardType = ReturnType<typeof useKeyboard>

const KeyboardCtx = createContext<useKeyboardType>({
	isKeyboardOpen: false
})

export const useKeyboardCtx = () => useContext(KeyboardCtx)

export const KeyboardProvider = ({ children }: { children: React.ReactNode }) => (
	<KeyboardCtx.Provider value={useKeyboard()}>
		{children}
	</KeyboardCtx.Provider>
)