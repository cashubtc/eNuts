/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ExpoConfig } from 'expo/config'

import { version } from './../package.json'

const IS_DEV = process.env.APP_VARIANT === 'dev'
const IS_PREVIEW = process.env.APP_VARIANT === 'preview'
const IS_PROD = process.env.APP_VARIANT === 'prod'



const config: ExpoConfig = {
	name: `eNuts${!IS_PROD ? ` (${process.env.APP_VARIANT})` : ''}`,
	slug: 'enuts',
	version: `${version}${!IS_PROD ? `-${process.env.APP_VARIANT}` : ''}`,
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
		package: `com.agron.enuts${!IS_PROD ? `.${process.env.APP_VARIANT}` : ''}`
	},
	web: {
		favicon: './assets/favicon.png'
	},
	extra: {
		eas: {
			projectId: 'edb75ccd-71ac-4934-9147-baf1c7f2b068'
		}, DEBUG: process.env.DEBUG,
		APP_VARIANT: process.env.APP_VARIANT,
	},
	owner: 'enuts_wallet'
}

export default config
