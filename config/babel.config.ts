import type { ConfigAPI, ConfigFunction, TransformOptions } from '@babel/core'

const fn: ConfigFunction = (api: ConfigAPI): TransformOptions => {
	api.cache.forever()
	return {
		presets: ['babel-preset-expo'],
		plugins: [
			'@babel/plugin-syntax-jsx',
			'react-native-reanimated/plugin',
			['@babel/plugin-proposal-private-methods', { loose: true }],
			[
				'module-resolver',
				{
					alias: {
						'@nav': './src/components/nav',
						'@comps': './src/components',
						'@screens': './src/components/screens',
						'@src': './src',
						'@assets': './assets',
						'@log': './src/logger',
						'@model': './src/model',
						'@styles': './src/styles',
						'@wallet': './src/wallet',
						'@db': './src/storage/db',
						'@util': './src/util',
						'@modal': './src/components/modal',
						'@store': './src/storage/store',
						'@consts': './src/consts',
					},
					extensions: ['.js', '.jsx', '.ts', '.tsx'],
				},
			],
		],
	}
}
export default fn
