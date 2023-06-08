
/**
 * If you're using Bugsnag:
 *   RN   https://docs.bugsnag.com/platforms/react-native/)
 *   Expo https://docs.bugsnag.com/platforms/react-native/expo/
 */
// import Bugsnag from "@bugsnag/react-native"
import Bugsnag from '@bugsnag/expo'
import { env } from '@src/consts'

/**
 *  This is where you put your crash reporting service initialization code to call in `./app/app.tsx`
 */
export function initCrashReporting() {
	return env.BUGSNAG_API_KEY ? Bugsnag.start(env.BUGSNAG_API_KEY) : undefined
}

/**
 * Error classifications used to sort errors on error reporting services.
 */
export enum ErrorType {
	/**
	 * An error that would normally cause a red screen in dev
	 * and force the user to sign out and restart.
	 */
	FATAL = 'Fatal',
	/**
	 * An error caught by try/catch where defined using Reactotron.tron.error.
	 */
	HANDLED = 'Handled',
}

/**
 * Manually report a handled error.
 */
export function reportCrash(error: Error, type: ErrorType = ErrorType.FATAL) {
	if (__DEV__) {
		// Log to console and Reactotron in development
		const message = error.message || 'Unknown'
		// eslint-disable-next-line no-console
		console.error(error)
		// eslint-disable-next-line no-console
		console.log(message, type)
		// eslint-disable-next-line no-console
		console?.tron?.log?.(error)
	} else { Bugsnag.notify(error) }
}
