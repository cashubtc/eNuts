/**
 * This file does the setup for integration with Reactotron, which is a
 * free desktop app for inspecting and debugging your React Native app.
 *
 * The functions are invoked from app.tsx and you can change the config there.
 *
 * Check out the "Custom Commands" section for some cool tools you can use,
 * customize, and make your own.
 *
 * Note that Fast Refresh doesn't play well with this file, so if you edit this,
 * do a full refresh of your app instead.
 *
 * @refresh reset
 */
import { isReactNativeDevMode } from '@consts'
import Config from '@src/config'
import { openInEditor, trackGlobalErrors } from 'reactotron-react-native'

import { Reactotron } from './reactotronClient'
import type { ReactotronConfig } from './reactotronConfig'
import { DEFAULT_REACTOTRON_CONFIG } from './reactotronConfig'
import { fakeReactotron } from './reactotronFake'

/**
 * We tell typescript we intend to hang Reactotron off of the console object.
 *
 * It'll live at console.tron, so you can use it like so:
 *
 *   console.tron.log('hello world')
 *
 * You can also import Reactotron yourself from ./reactotronClient
 * and use it directly, like Reactotron.log('hello world')
 */
declare global {
	interface Console {
		/**
		 * Reactotron client for logging, displaying, measuring performance,
		 * and more. See https://github.com/infinitered/reactotron for more!
		 */
		tron: typeof Reactotron
	}
}



// in dev, we attach Reactotron, in prod we attach a interface-compatible mock.
if (isReactNativeDevMode) {
	// eslint-disable-next-line no-console
	console.tron = Reactotron // attach reactotron to `console.tron`
} else {
	// attach a mock so if things sneak by our isReactNativeDevMode guards, we won't crash.
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	console.tron = fakeReactotron// eslint-disable-line no-console
}

const config = DEFAULT_REACTOTRON_CONFIG


// Avoid setting up Reactotron multiple times with Fast Refresh
let _reactotronIsSetUp = false
/**
 * Configure reactotron based on the the config settings passed in, then connect if we need to.
 */
export function setupReactotron(customConfig: ReactotronConfig = {}) {
	// only run this in dev... metro bundler will ignore this block: 🎉
	if (isReactNativeDevMode) {
		// only setup once.
		if (_reactotronIsSetUp) { return }

		// merge the passed in config with our default config
		Object.assign(config, customConfig)
		if (config?.host) {
			config.host = Config?.hostname
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
			/* config.host = NativeModules.SourceCode.scriptURL
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				.split('://')[1] // Remove the scheme
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				.split('/')[0] // Remove the path
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				.split(':')[0] // Remove the port 
		} */
		}
		// configure reactotron
		Reactotron.configure({
			...config,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-var-requires
			name: config.name || require('../../../package.json').name,
			host: config.host,
		})
			.useReactNative({
				networking: {
					ignoreUrls: /\/(logs|symbolicate|127.0.0.1)$//* gi */
					//new RegExp(`symbolicate|127.0.0.1|http://${config.host}:19000/logs`),
				},
			})
			.use(trackGlobalErrors({}))
			.use(openInEditor())
			// .use(networking({ ignoreUrls: /\/(logs|symbolicate)$/gi }))
			.connect()

		_reactotronIsSetUp = true
		isReactotronRunnig = isReactNativeDevMode && _reactotronIsSetUp
		// eslint-disable-next-line no-console
		console.log(
			'Reactotron Configured', isReactotronRunnig,
			isReactNativeDevMode, _reactotronIsSetUp
		)
	}
}

export let isReactotronRunnig: Readonly<boolean> = isReactNativeDevMode && _reactotronIsSetUp