import { config as dotenvConfig } from 'dotenv'
import { ExpoConfig } from 'expo/config'

import { version } from './../package.json'

type AppVariant = 'preview' | 'prod' | 'dev' | undefined

function nodeEnvShort(): 'test' | AppVariant {
	if (!process?.env?.NODE_ENV) {
		process.env.NODE_ENV = 'development'
		return
	}
	if (process.env.NODE_ENV === 'production') { return 'prod' }
	if (process.env.NODE_ENV === 'development') { return 'dev' }
	if (process.env.NODE_ENV === 'test') { return 'test' }
	if (process.env.NODE_ENV === 'preview') { return 'preview' }
}
function appVariant(): AppVariant {
	if (!process?.env?.APP_VARIANT) {
		process.env.APP_VARIANT = 'dev'
		return
	}
	if (process.env.APP_VARIANT === 'prod') { return 'prod' }
	if (process.env.APP_VARIANT === 'dev') { return 'dev' }
	if (process.env.APP_VARIANT === 'preview') { return 'preview' }
}

const _appVariant = appVariant() || process.env.APP_VARIANT || 'dev'

const _nodeEnvShort = nodeEnvShort()

try {
	dotenvConfig({ path: `.env${_nodeEnvShort === 'prod' ? '' : `.${nodeEnvShort()}`}` })
} catch (e) { console.log('dotenv error:', e) } // eslint-disable-line no-console

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
const IS_DEV = _appVariant === 'dev'
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
const IS_PREVIEW = _appVariant === 'preview'
const IS_PROD = _appVariant === 'prod'

const config: ExpoConfig = {
	name: `eNuts${!IS_PROD ? ` (${_appVariant})` : ''}`,
	slug: 'enuts',
	owner: 'enuts_wallet',
	version: `${version}${!IS_PROD ? `-${_appVariant}` : ''}`,
	scheme: 'cashu',
	orientation: 'portrait',
	icon: './assets/icon.png',
	userInterfaceStyle: 'light',
	splash: {
		image: './assets/splash.png',
		resizeMode: 'contain',
		backgroundColor: '#5DB075'
	},
	assetBundlePatterns: ['**/*'],
	plugins: [
		'@bugsnag/plugin-expo-eas-sourcemaps',
		'expo-localization',
		[
			'expo-barcode-scanner',
			{
				cameraPermission: 'Allow eNuts to access camera.'
			}
		],
		[
			'expo-camera',
			{
				cameraPermission: 'Allow eNuts to access camera.'
			}
		]
	],
	ios: {
		supportsTablet: true,
		infoPlist: {
			LSApplicationQueriesSchemes: ['cashu']
		}
	},
	android: {
		adaptiveIcon: {
			foregroundImage: './assets/adaptive-icon.png',
			backgroundColor: '#5DB075'
		},
		package: `com.agron.enuts${!IS_PROD ? `.${_appVariant}` : ''}`
	},
	web: {
		favicon: './assets/favicon.png'
	},
	extra: {
		eas: { projectId: 'edb75ccd-71ac-4934-9147-baf1c7f2b068' },
		DEBUG: process.env.DEBUG,
		APP_VARIANT: _appVariant,
		bugsnag: { 'apiKey': process.env.BUGSNAG_API_KEY, },
		NODE_ENV: process.env.NODE_ENV,
		NODE_ENV_SHORT: _nodeEnvShort,
	}
}
// eslint-disable-next-line no-console
console.log(
	'bugsnag',
	config?.extra?.bugsnag,
	process.env.BUGSNAG_API_KEY,
	process.env.BUGSNAG_APIKEY
)


export default config
