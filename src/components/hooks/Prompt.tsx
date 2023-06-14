import { useState } from 'react'

interface IPromptState {
	open: boolean
	success?: boolean
	msg: string
}

export default function usePrompt() {
	const [prompt, setPrompt] = useState<IPromptState>({ open: false, msg: '' })
	const openPrompt = (msg: string) => {
		setTimeout(() => setPrompt({ open: true, msg }))
	}
	const closePrompt = () => {
		setPrompt({ open: false, msg: '' })
	}
	const openPromptAutoClose = (success: boolean, msg: string) => {
		setPrompt({ success, open: true, msg })
		const t = setTimeout(() => {
			setPrompt({ open: false, msg: '' })
			clearTimeout(t)
		}, 2500)
	}

	return {
		prompt,
		openPrompt,
		closePrompt,
		openPromptAutoClose
	}

}