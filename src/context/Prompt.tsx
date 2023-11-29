import { l } from '@log'
import type { IOpenPromptAutoCloseProps, IPromptState } from '@model'
import { createContext, useContext, useRef, useState } from 'react'

const usePrompt = () => {
	const timerId = useRef<ReturnType<typeof setTimeout>>()
	const [prompt, setPrompt] = useState<IPromptState>({ open: false, msg: '' })

	const startClosingTimer = (ms?: number) => {
		timerId.current = setTimeout(() => {
			closePrompt()
			clearTimer()
		}, ms ?? 2500)
	}

	const clearTimer = () => {
		clearTimeout(timerId.current)
		timerId.current = undefined
	}

	const openPrompt = (
		msg: string,
		success?: boolean,
	) => setPrompt({ open: true, success, msg })

	const closePrompt = () => {
		setPrompt({ open: false, msg: '' })
		if (timerId.current) { clearTimer() }
	}

	const openPromptAutoClose = ({ msg, success, ms }: IOpenPromptAutoCloseProps) => {
		openPrompt(msg, success)
		if (timerId.current) { clearTimer() }
		startClosingTimer(ms)
	}

	return {
		prompt,
		openPrompt,
		closePrompt,
		openPromptAutoClose
	}
}
type usePromptType = ReturnType<typeof usePrompt>
/**
 * A state that indicates if a cashu token has been claimed from
 * clipboard after the app comes to the foreground.
 * It is used to re-render the total balance after claiming
 */
const PromptCtx = createContext<usePromptType>({
	prompt: { open: false, msg: '' },
	openPrompt: (msg: string) => l(msg),
	closePrompt: () => l(''),
	openPromptAutoClose: ({ msg, success, ms }) => l(msg, success, ms)
})

export const usePromptContext = () => useContext(PromptCtx)

export const PromptProvider = ({ children }: { children: React.ReactNode }) => (
	<PromptCtx.Provider value={usePrompt()} >
		{children}
	</PromptCtx.Provider>
)