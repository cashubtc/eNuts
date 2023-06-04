import 'expo-dev-client'

import App from '@comps/App'
import { l } from '@log'
import type { IInitialProps } from '@model'
import { registerRootComponent } from 'expo'

l('AppEntryPoint')

const x: IInitialProps = {
	exp: {},
	mode: '\nDEV MODE\n'
}

// eslint-disable-next-line new-cap
registerRootComponent(() => App(x))
