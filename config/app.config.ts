import { config as dotenvConfig } from 'dotenv'
import type { ExpoConfig } from 'expo/config'

import { version } from './../package.json'

type AppVariant = 'preview' | 'prod' | 'dev' | undefined

function nodeEnvShort(): 'test' | AppVariant {
	if (!process?.env?.NODE_ENV) {
		process.env.NODE_ENV = 'development'
		return
	}
	if (process?.env?.NODE_ENV === 'production') { return 'prod' }
	if (process?.env?.NODE_ENV === 'development') { return 'dev' }
	if (process?.env?.NODE_ENV === 'test') { return 'test' }
	if (process?.env?.NODE_ENV === 'preview') { return 'preview' }
}

function appVariant(): AppVariant {
	if (!process?.env?.APP_VARIANT) {
		process.env.APP_VARIANT = 'dev'
		return
	}
	if (process?.env?.APP_VARIANT === 'prod') { return 'prod' }
	if (process?.env?.APP_VARIANT === 'dev') { return 'dev' }
	if (process?.env?.APP_VARIANT === 'preview') { return 'preview' }
}

const _appVariant = appVariant() || process?.env?.APP_VARIANT || 'dev'

const _nodeEnvShort = nodeEnvShort()

try {
	dotenvConfig({ path: `.env${_nodeEnvShort === 'prod' ? '' : `.${nodeEnvShort()}`}` })
} catch (e) {
	try {
		dotenvConfig({ path: `envs/.env${_nodeEnvShort === 'prod' ? '' : `.${nodeEnvShort()}`}` })
	} catch (e) { console.log('dotenv error:', e) } // eslint-disable-line no-console
}

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
	icon: './assets/app-icon-all.png',
	userInterfaceStyle: 'automatic',
	splash: {
		image: './assets/splash.png',
		resizeMode: 'contain',
		backgroundColor: '#5DB075'
	},
	assetBundlePatterns: ['**/*'],
	plugins: [
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
		],
		'sentry-expo'
	],
	ios: {
		supportsTablet: true,
		infoPlist: {
			LSApplicationQueriesSchemes: ['cashu']
		}
	},
	android: {
		icon: './assets/app-icon-android-legacy.png',
		adaptiveIcon: {
			foregroundImage: './assets/app-icon-android-adaptive-foreground.png',
			backgroundImage: './assets/app-icon-android-adaptive-background.png'
		},
		package: `com.agron.enuts${!IS_PROD ? `.${_appVariant}` : ''}`
	},
	web: {
		favicon: './assets/favicon.png'
	},
	extra: {
		eas: { projectId: 'edb75ccd-71ac-4934-9147-baf1c7f2b068' },
		DEBUG: process?.env?.DEBUG,
		APP_VARIANT: _appVariant,
		NODE_ENV: process?.env?.NODE_ENV,
		NODE_ENV_SHORT: _nodeEnvShort,
		SENTRY_DSN: process?.env?.SENTRY_DSN,
		SENTRY_ORG: process?.env?.SENTRY_ORG,
		SENTRY_PROJECT: process?.env?.SENTRY_PROJECT
	},
	hooks: {
		postPublish: [
			{
				file: 'sentry-expo/upload-sourcemaps',
				config: {
					organization: process?.env?.SENTRY_ORG,
					project: process?.env?.SENTRY_PROJECT
				} 
			}
		]
	}
}

/*

{
  "name": "",
  "displayName": "",
  "expo": {
    "name": "",
    "slug": "",
    "scheme": "",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/app-icon-all.png",
    "splash": {
      "image": "./assets/images/splash-logo-all.png",
      "resizeMode": "contain",
      "backgroundColor": "#191015"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
   "android": {
      "icon": "./assets/images/app-icon-android-legacy.png",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/app-icon-android-adaptive-foreground.png",
        "backgroundImage": "./assets/images/app-icon-android-adaptive-background.png"
      },
      "splash": {
        "image": "./assets/images/splash-logo-android-universal.png",
        "resizeMode": "contain",
        "backgroundColor": "#191015"
      }
    },
    "ios": {
      "icon": "./assets/images/app-icon-ios.png",
      "supportsTablet": true,
      "bundleIdentifier": "com.helloworld",
      "splash": {
        "image": "./assets/images/splash-logo-ios-mobile.png",
        "tabletImage": "./assets/images/splash-logo-ios-tablet.png",
        "resizeMode": "contain",
        "backgroundColor": "#191015"
      }
    },
}

*/

export default config