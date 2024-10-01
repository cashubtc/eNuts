import App from '@comps/App'
import { l } from '@log'
import { registerRootComponent } from 'expo'

l('AppEntryPoint')
// eslint-disable-next-line new-cap
registerRootComponent(App)
