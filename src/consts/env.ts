/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Constants from 'expo-constants'

export const env = {
	DEBUG: process.env.DEBUG || Constants?.expoConfig?.extra?.DEBUG,
	NODE_ENV: process.env.NODE_ENV || Constants?.expoConfig?.extra?.NODE_ENV,
	APP_VARIANT: process.env.APP_VARIANT || Constants?.expoConfig?.extra?.APP_VARIANT,
}