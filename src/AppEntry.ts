// dont touch this
// import 'expo-dev-client'
import './shim'
import './i18n'

import App from '@comps/App'
import { l } from '@log'
import { registerRootComponent } from 'expo'

import Config from './config'
import { initCrashReporting } from './util/crashReporting'

l({
	host: Config.hostname,
	port: Config.port

}, typeof __DEV__)
if (__DEV__) {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
	const { connectToDevTools } = require('react-devtools-core')
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	connectToDevTools({
		host: Config.hostname,
		port: Config.port

	})
}


initCrashReporting()
l('AppEntryPoint')

// eslint-disable-next-line new-cap
registerRootComponent(App)
