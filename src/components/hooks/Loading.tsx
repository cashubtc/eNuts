import { useState } from 'react'

export default function useLoading() {
	const [loading, setLoading] = useState(false)
	const startLoading = () => setLoading(true)
	const stopLoading = () => setLoading(false)

	return {
		loading,
		startLoading,
		stopLoading
	}

}