import type { ITokenInfo } from '@model'
import { useState } from 'react'

export default function useCashuToken() {
	const [token, setToken] = useState('')
	const [tokenInfo, setTokenInfo] = useState<ITokenInfo | undefined>()
	const [trustModal, setTrustModal] = useState(false)

	return {
		token,
		setToken,
		tokenInfo,
		setTokenInfo,
		trustModal,
		setTrustModal
	}
}