import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { useEffect, useState } from 'react'

export default function useNostr() {
	const [hasContacts, setHasContacts] = useState(false)
	useEffect(() => {
		void (async () => {
			const npub = await store.get(STORE_KEYS.npub)
			setHasContacts(!!npub)
		})()
	}, [])

	return {
		hasContacts
	}
}