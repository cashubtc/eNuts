import type { TBeforeRemoveEvent } from '@model/nav'
import { l } from '@src/logger'

export function preventBack(e: TBeforeRemoveEvent, dispatch: (action: any) => void) {
	e.preventDefault()
	l({
		payload: e.data.action.payload,
		type: e.data.action.type,
		source: e.data.action.source,
		target: e.data.action.target,
	})
	// allow navigating to dashboard
	if (e.data.action.payload && 'name' in e.data.action.payload && e.data.action.payload.name === 'dashboard') {
		dispatch(e.data.action)
	}
}