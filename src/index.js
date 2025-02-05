/* eslint-disable import/first */

// require('dotenv').config()
// init sentry and crash reporting
// require('./util/crashReporting').initCrashReporting()

// dont touch this!
import './shim'
import './i18n'

// imports
import { l } from '@log'

import Config from './config'


l({
	host: Config.hostname,
	port: Config.port

}, typeof __DEV__)
if (typeof __DEV__ !== 'undefined' && __DEV__) { // eslint-disable-line no-undef
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
	const { connectToDevTools } = require('react-devtools-core')
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	connectToDevTools({
		host: Config.hostname,
		port: Config.port

	})
}
l('EntryPoint')
require('./App')