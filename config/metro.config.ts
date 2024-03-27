// Learn more https://docs.expo.io/guides/customizing-metro
// https://docs.expo.dev/guides/using-sentry/#update-metro-configuration

// This replaces `const { getDefaultConfig } = require('expo/metro-config');`
import { getSentryExpoConfig } from '@sentry/react-native/metro'
import { readdirSync } from 'fs'
import { join, resolve } from 'path'


const root = resolve(join(__dirname, '..', ''))
const assertDir = resolve(join(root, 'assets'))

// This replaces const config = getDefaultConfig(root)
export const config = getSentryExpoConfig(root) 

const assetExts = [...new Set([
	...config?.resolver?.assetExts ?? [],
	'db',
	...readdirSync(assertDir, { withFileTypes: true, recursive: true })
		.filter(x => x.isFile())
		.map(x => x.name.slice(x.name.lastIndexOf('.') + 1))
])]
if (config.resolver?.assetExts) { config.resolver.assetExts = assetExts }

