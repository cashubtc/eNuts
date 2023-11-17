import { env } from '@src/consts'
import { NativeModules } from 'react-native'

function getDebugHost() {
	try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const raw = NativeModules?.SourceCode?.scriptURL as string | undefined
		if (!raw || typeof raw !== 'string') { return }
		const url = new URL(raw)
		return { hostname: url.hostname, port: url.port }
		// eslint-disable-next-line no-console
	} catch (e) { console.log('[getDebugHost][Error]', e) }
}
export interface ConfigBaseProps {
	persistNavigation: 'always' | 'dev' | 'prod' | 'never'
	catchErrors: 'always' | 'dev' | 'prod' | 'never'
	exitRoutes: string[]
	env: typeof env
	hostname?: string | undefined;
	port?: string | undefined;
}

export type PersistNavigationConfig = ConfigBaseProps['persistNavigation']

const BaseConfig = {
	// This feature is particularly useful in development mode, but
	// can be used in production as well if you prefer.
	persistNavigation: 'dev',

	/**
   * Only enable if we're catching errors in the right environment
   */
	catchErrors: 'always',

	/**
   * This is a list of all the route names that will exit the app if the back button
   * is pressed while in that screen. Only affects Android.
   */
	exitRoutes: ['dashboard'],
	env,
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
	...getDebugHost() ?? {}
} as const

export default BaseConfig
