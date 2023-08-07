import type { IOpenPromptAutoCloseProps, IPromptState } from '@model'
import { useState } from 'react'

export default function usePrompt() {
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