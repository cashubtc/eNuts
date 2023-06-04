import { useState } from 'react'

export default function usePrompt() {
	const [prompt, setPrompt] = useState({ open: false, msg: '' })
	const openPrompt = (msg: string) => {
		setPrompt({ open: true, msg })
	}
	const closePrompt = () => {
		setPrompt({ open: false, msg: '' })
	}

	return {
		prompt,
		openPrompt,
		closePrompt
	}

}