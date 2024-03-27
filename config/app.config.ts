import { config as dotenvConfig } from 'dotenv'
import type { ExpoConfig } from 'expo/config'

import { version } from './../package.json'

type AppVariant = 'preview' | 'beta' | 'prod' | 'dev' | undefined

function nodeEnvShort(): 'test' | AppVariant {
	if (!process?.env?.NODE_ENV) {
		process.env.NODE_ENV = 'development'
		return
	}
	if (process?.env?.NODE_ENV === 'production') { return 'prod' }
	if (process?.env?.NODE_ENV === 'development') { return 'dev' }
	if (process?.env?.NODE_ENV === 'test') { return 'test' }
	if (process?.env?.NODE_ENV === 'preview') { return 'preview' }
	if (process?.env?.NODE_ENV === 'beta') { return 'beta' }
}

function appVariant(): AppVariant {
	if (!process?.env?.APP_VARIANT) {
		process.env.APP_VARIANT = 'dev'
		return
	}
	if (process?.env?.APP_VARIANT === 'prod') { return 'prod' }
	if (process?.env?.APP_VARIANT === 'dev') { return 'dev' }
	if (process?.env?.APP_VARIANT === 'preview') { return 'preview' }
	if (process?.env?.APP_VARIANT === 'beta') { return 'beta' }
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
// const IS_DEV = _appVariant === 'dev'
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
// const IS_PREVIEW = _appVariant === 'preview'
const IS_BETA = _appVariant === 'beta'
const IS_PROD = _appVariant === 'prod'

const cameraPermission = 'eNuts requires access to your camera to scan QR codes for wallet transactions.'

const config: ExpoConfig = {
	experiments: { tsconfigPaths: true },
	name: `eNuts${!IS_PROD ? ` (${_appVariant})` : ''}`,
	slug: 'enuts',
	owner: 'enuts_wallet',
	privacy: 'public',
	platforms: [
		'ios',
		'android',
	],
	version: `${version}${!IS_PROD && !IS_BETA ? `-${_appVariant}` : ''}`,
	scheme: ['cashu', 'lightning'],
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
		['expo-barcode-scanner', { cameraPermission }],
		['expo-camera', { cameraPermission }],
		'expo-secure-store',
		[
			'@sentry/react-native/expo',
			{
				organization: process?.env?.SENTRY_ORG, // || 'sentry org slug, or use the `SENTRY_ORG` environment variable',
				project: process?.env?.SENTRY_PROJECT, // || 'sentry project name, or use the `SENTRY_PROJECT` environment variable',
				dsn: process?.env?.SENTRY_DSN, // || 'sentry dsn, or use the `SENTRY_DSN` environment variable',
				authToken: process?.env?.SENTRY_AUTH_TOKEN, // || 'sentry auth token, or use the `SENTRY_AUTH_TOKEN` environment variable',
			}
		],
		'@config-plugins/detox'
	],
	ios: {
		supportsTablet: false,
		infoPlist: {
			LSApplicationQueriesSchemes: ['cashu', 'lightning']
		},
		config: {
			usesNonExemptEncryption: false
		},
		bundleIdentifier: 'xyz.elliptica.enuts',
		buildNumber: '1'
	},
	android: {
		icon: './assets/app-icon-android-legacy.png',
		adaptiveIcon: {
			foregroundImage: './assets/app-icon-android-adaptive-foreground.png',
			backgroundImage: './assets/app-icon-android-adaptive-background.png'
		},
		package: `xyz.elliptica.enuts${!IS_PROD ? `.${_appVariant}` : ''}`
	},
	extra: {
		eas: { projectId: 'edb75ccd-71ac-4934-9147-baf1c7f2b068' },
		DEBUG: process?.env?.DEBUG,
		APP_VARIANT: _appVariant,
		NODE_ENV: process?.env?.NODE_ENV,
		NODE_ENV_SHORT: _nodeEnvShort,
		SENTRY_DSN: process?.env?.SENTRY_DSN,
		SENTRY_ORG: process?.env?.SENTRY_ORG,
		SENTRY_PROJECT: process?.env?.SENTRY_PROJECT,
		SENTRY_AUTH_TOKEN: process?.env?.SENTRY_AUTH_TOKEN
	}
}

export default config