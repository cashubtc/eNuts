import { isCashuToken, isLnInvoice } from '@util'
import { useCallback, useEffect, useState } from 'react'
import type { EmitterSubscription } from 'react-native'
import { Linking } from 'react-native'

export interface EventType {
	url: string
	nativeEvent?: MessageEvent
}
/**
 * stolen from expo
 * Add a handler to `Linking` changes by listening to the `url` event type and providing the handler.
 * It is recommended to use the [`useURL()`](#useurl) hook instead.
 * @param type The only valid type is `'url'`.
 * @param handler An [`URLListener`](#urllistener) function that takes an `event` object of the type
 * [`EventType`](#eventype).
 * @return An EmitterSubscription that has the remove method from EventSubscription
 * @see [React Native Docs Linking page](https://reactnative.dev/docs/linking#addeventlistener).
 */
export function addEventListener(type: 'url', handler: (event: EventType) => void): EmitterSubscription {
	return Linking.addEventListener(type, (e) => {
		// alert('calling link event')
		handler(e)
	})
}
export const useInitialURL = () => {
	const [url, setUrl] = useState<string>('')
	const [processing, setProcessing] = useState(true)

	function onChange(event: { url: string }) {
		if (!event?.url) { return setUrl('') }
		if (isCashuToken(event.url) || isLnInvoice(event.url)) {
			return setUrl(event.url)
		}
		setUrl('')
	}

	const clearUrl = useCallback(() => setUrl(''), [])

	useEffect(() => {
		const getUrlAsync = async () => {
			// Get the deep link used to open the app
			let initialUrl = await Linking.getInitialURL() || ''
			if (!initialUrl) { return }
			initialUrl = isCashuToken(initialUrl) || isLnInvoice(initialUrl) || ''
			setProcessing(false)
			return setUrl(initialUrl)
		}
		void getUrlAsync()
		const subscription = addEventListener('url', onChange)
		return () => subscription.remove()
	}, [])

	return { url, clearUrl, processing }
}