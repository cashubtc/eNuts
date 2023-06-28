// Learn more https://docs.expo.io/guides/customizing-metro

import { getDefaultConfig } from '@expo/metro-config'
import { readdirSync } from 'fs'
// import { mergeConfig } from 'metro-config'
import { join, resolve } from 'path'

const root = resolve(join(__dirname, '..', ''))
const assertDir = resolve(join(root, 'assets'))

export const config = getDefaultConfig(root)

const assetExts = [...new Set([
	...config?.resolver?.assetExts ?? [],
	'db',
	...readdirSync(assertDir, { withFileTypes: true, recursive: true })
		.filter(x => x.isFile())
		.map(x => x.name.slice(x.name.lastIndexOf('.') + 1))
])]
if (config.resolver?.assetExts) { config.resolver.assetExts = assetExts }

// config mergeConfig(config, { resolver: { ...config.resolver, assetExts } })