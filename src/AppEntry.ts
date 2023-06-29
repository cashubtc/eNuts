// dont touch this
import 'expo-dev-client'
import './shim'
import './i18n'

import App from '@comps/App'
import { isReactNativeDevMode } from '@consts'
import { l } from '@log'
import { setupReactotron } from '@log/reactotron'
import { registerRootComponent } from 'expo'

// Set up Reactotron, which is a free desktop app for inspecting and debugging
// React Native apps. Learn more here: https://github.com/infinitered/reactotron
if (isReactNativeDevMode) {
	setupReactotron({
		// clear the Reactotron window when the app loads/reloads
		clearOnLoad: true,
		// generally going to be localhost
		// host: hostname,
		// Reactotron can monitor AsyncStorage for you
		useAsyncStorage: false,
		// log the initial restored state from AsyncStorage
		logInitialState: true,
		// log out any snapshots as they happen (this is useful for debugging but slow)
		logSnapshots: false,
	})
}

l('AppEntryPoint')

// eslint-disable-next-line new-cap
registerRootComponent(App)
