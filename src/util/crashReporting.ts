

import { env, isReactNativeDevMode } from '@consts'
import type { ErrorInfo } from 'react'
import * as Sentry from 'sentry-expo'

/**
 *  This is where you put your crash reporting service initialization code to call in `./app/app.tsx`
 */
export let routingInstrumentation:Sentry.Native.ReactNavigationInstrumentation
export function initCrashReporting() {
	if (env.SENTRY_DSN) {
		// Construct a new instrumentation instance. This is needed to communicate between the integration and React
		const routingInstrumentation = new Sentry.Native.RoutingInstrumentation()
		Sentry.init({
			dsn: env.SENTRY_DSN,
			integrations: [new Sentry.Native.ReactNativeTracing({routingInstrumentation})],
			enableInExpoDevelopment: true,
			debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
			tracesSampleRate: 1.0,
			autoSessionTracking: true,
		})
	}
	require('@util/promise')
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
	 * An error caught by try/catch
	 */
	HANDLED = 'Handled',
}

/**
 * Manually report a handled error.
 */
export function reportCrash(error: Error, errInfo: ErrorInfo, type: ErrorType = ErrorType.FATAL) {
	if (isReactNativeDevMode) {
		// Log to console
		const message = error.message || 'Unknown'
		// eslint-disable-next-line no-console
		console.error(error, errInfo)
		// eslint-disable-next-line no-console
		console.log(message, type)
	} else if (env.SENTRY_DSN) { Sentry.Native.captureException(error) }
}
