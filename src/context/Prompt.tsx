import { l } from '@log'
import type { IOpenPromptAutoCloseProps, IPromptState } from '@model'
import { createContext, useState } from 'react'

const usePrompt = () => {
	const [prompt, setPrompt] = useState<IPromptState>({ open: false, msg: '' })
	const openPrompt = (msg: string) => {
		setPrompt({ open: true, msg })
	}
	const closePrompt = () => {
		setPrompt({ open: false, msg: '' })
	}
	const openPromptAutoClose = ({ msg, success, ms }: IOpenPromptAutoCloseProps) => {
		setPrompt({ success, open: true, msg })
		const t = setTimeout(() => {
			setPrompt({ open: false, msg: '' })
			clearTimeout(t)
		}, ms ?? 2500)
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
export const PromptCtx = createContext<usePromptType>({
	prompt: { open: false, msg: '' },
	openPrompt: (msg: string) => l(msg),
	closePrompt: () => l(''),
	openPromptAutoClose: ({ msg, success, ms }) => l(msg, success, ms)
})