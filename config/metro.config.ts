// Learn more https://docs.expo.io/guides/customizing-metro
// import * as c from '@expo/metro-config'
import { getDefaultConfig } from '@expo/metro-config'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { makeMetroConfig } from '@rnx-kit/metro-config'
import MetroSymlinksResolver from '@rnx-kit/metro-resolver-symlinks'
import { MetroSerializer } from '@rnx-kit/metro-serializer'
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
		serializer: {
			...config?.serializer ?? {},
			// eslint-disable-next-line new-cap, @typescript-eslint/no-unsafe-call
			customSerializer: MetroSerializer([
				// eslint-disable-next-line new-cap
				/* CyclicDependencies({
					includeNodeModules: false,
					linesOfContext: 1,
					throwOnError: true,
				}),
				// eslint-disable-next-line new-cap
				DuplicateDependencies({
					ignoredModules: [],
					bannedModules: [],
					throwOnError: true,
				}), */
			]),
		},
		projectRoot: config?.projectRoot ?? join(__dirname, '..', ''),
		resolver: {
			...config?.resolver ?? {},
			// eslint-disable-next-line new-cap
			resolveRequest: (context: ResolutionContext, moduleName: string, platform: string | null) => {
				if (moduleName === 'missing-asset-registry-path') {
					// console.log({ /* context, */ moduleName, o: context.originModulePath })
					return { type: 'assetFiles', filePaths: [context.originModulePath] }
				}
				return  metroSymlinksResolver(context, moduleName, platform)
			},
			assetExts: [...config?.resolver?.assetExts ?? [], 'db'],
			// assetRegistryPath: resolve('node_modules/react-native/Libraries/Image/AssetRegistry')
		},
	}) as InputConfigT,
}

module.exports = c

