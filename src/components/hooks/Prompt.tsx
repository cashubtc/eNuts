import { useState } from 'react'

interface IPromptState {
	open: boolean
	success?: boolean
	msg: string
}

interface IOpenPromptAutoCloseProps {
	msg: string
	success?: boolean
	ms?: number
}

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