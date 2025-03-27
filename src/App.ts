import App from '@comps/App'
import { l } from '@log'
import { withProfiler } from '@sentry/react-native'
import { registerRootComponent } from 'expo'

l('AppEntryPoint')
 
registerRootComponent(withProfiler(App))
