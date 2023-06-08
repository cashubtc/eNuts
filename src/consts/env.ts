
import type { IExpoConfig } from '@src/model'
import Constants from 'expo-constants'

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

const config: Readonly<IExpoConfig | undefined | null> = Constants?.expoConfig
export const env: Readonly<IExpoConfig['extra'] & { BUGSNAG_API_KEY?: string }> = {
	DEBUG: process.env.DEBUG || config?.extra?.DEBUG,

	NODE_ENV: process.env.NODE_ENV || config?.extra?.NODE_ENV,

	NODE_ENV_SHORT: process.env.NODE_ENV_SHORT || config?.extra?.NODE_ENV_SHORT || nodeEnvShort() || appVariant(),

	APP_VARIANT: process.env.APP_VARIANT || config?.extra?.APP_VARIANT || appVariant() || nodeEnvShort(),

	BUGSNAG_API_KEY: process.env.BUGSNAG_API_KEY
		|| process.env.BUGSNAG_APIKEY
		|| config?.extra?.bugsnag?.apiKey,


} as const