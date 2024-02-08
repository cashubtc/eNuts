import type { TBeforeRemoveEvent } from '@model/nav'
import { l } from '@src/logger'

const screens = [
	'dashboard',
	'auth',
	'qr scan',
	'Security settings',
	'General settings',
	'Address book',
	'Seed',
]

export function preventBack(e: TBeforeRemoveEvent, dispatch: (action: any) => void) {
	e.preventDefault()
	l({
		payload: e.data.action.payload,
		type: e.data.action.type,
		source: e.data.action.source,
		target: e.data.action.target,
	})
	for (let i = 0; i < screens.length; i++) {
		const screen = screens[i]
		if (e.data.action.payload && 'name' in e.data.action.payload && e.data.action.payload.name === screen) {
			dispatch(e.data.action)
		}
	}
}