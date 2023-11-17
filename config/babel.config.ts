import type { ConfigAPI, ConfigFunction, TransformOptions } from '@babel/core'

const fn: ConfigFunction = (api: ConfigAPI): TransformOptions => {
	api.cache.forever()
	return {
		sourceMaps:'both',
		presets: ['babel-preset-expo'],
		plugins: [
			'@babel/plugin-syntax-jsx',
			'react-native-reanimated/plugin',
			'@babel/plugin-transform-flow-strip-types',
			['@babel/plugin-proposal-private-methods', { loose: true }]
		]
	}
}
export default fn
