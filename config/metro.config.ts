// Learn more https://docs.expo.io/guides/customizing-metro
import { getDefaultConfig } from '@expo/metro-config'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { makeMetroConfig } from '@rnx-kit/metro-config'
import MetroSymlinksResolver from '@rnx-kit/metro-resolver-symlinks'
import type { InputConfigT } from 'metro-config'
import type { ResolutionContext } from 'metro-resolver/src/types'
import { join } from 'path'

const config = getDefaultConfig(join(__dirname, '..', ''))

// eslint-disable-next-line new-cap
const metroSymlinksResolver = MetroSymlinksResolver()
const c = {
	...config,
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	...makeMetroConfig({
		serializer: { ...config?.serializer ?? {}},
		projectRoot: config?.projectRoot ?? join(__dirname, '..', ''),
		resolver: {
			...config?.resolver ?? {},
			// eslint-disable-next-line new-cap
			resolveRequest: (context: ResolutionContext, moduleName: string, platform: string | null) => {
				if (moduleName === 'missing-asset-registry-path') {
					return { type: 'assetFiles', filePaths: [context.originModulePath] }
				}
				return  metroSymlinksResolver(context, moduleName, platform)
			},
			assetExts: [...config?.resolver?.assetExts ?? [], 'db']
		},
	}) as InputConfigT,
}

module.exports = c

