 

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
	 
	const { connectToDevTools } = require('react-devtools-core')
	 
	connectToDevTools({
		host: Config.hostname,
		port: Config.port

	})
}
l('EntryPoint')
require('./App')