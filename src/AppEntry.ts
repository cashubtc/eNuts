// dont touch this
import './shim'
import 'expo-dev-client'

import App from '@comps/App'
import { l } from '@log'
import type { IInitialProps } from '@model'
import { registerRootComponent } from 'expo'

import { setupReactotron } from './services/reactotron'



// Set up Reactotron, which is a free desktop app for inspecting and debugging
// React Native apps. Learn more here: https://github.com/infinitered/reactotron
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

l('AppEntryPoint')

const x: IInitialProps = {
	exp: {},
	mode: '\nDEV MODE\n'
}

// eslint-disable-next-line new-cap
registerRootComponent(() => App(x))
