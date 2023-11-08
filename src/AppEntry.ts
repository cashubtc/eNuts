// dont touch this
// import 'expo-dev-client'
import './shim'
import './i18n'

import App from '@comps/App'
import { l } from '@log'
import { registerRootComponent } from 'expo'

import { initCrashReporting } from './util/crashReporting'

initCrashReporting()
l('AppEntryPoint')

// eslint-disable-next-line new-cap
registerRootComponent(App)
