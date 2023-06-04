// import type { Config } from 'jest'
// import { defaults } from 'jest-config'
import { JestConfigWithTsJest,pathsToModuleNameMapper } from 'ts-jest'

import { compilerOptions } from '../tsconfig.json'

export default (): JestConfigWithTsJest => ({
	'rootDir': '..',
	// ...defaults,
	// setupFiles: ['<rootDir>/test/envSetup.ts'],
	// setupFilesAfterEnv: ['<rootDir>/test/testSetupFile.ts'],
	// testEnvironment: 'node',
	transform: {
		'^.+\\.ts?$':
			['ts-jest',
				{
					// babelConfig: true,
					'tsconfig': '<rootDir>/tsconfig.json',
					'diagnostics': true
				}]
	},
	resolver: 'ts-jest-resolver',
	testRegex: 'test/.*\\.(test|spec)?\\.(ts|tsx)$',
	// moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	preset: 'jest-expo',
	transformIgnorePatterns: [
		'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
	],

	// moduleDirectories: ['<rootDir>/node_modules', '<rootDir>'],
	moduleNameMapper: {
		// '^@db(.*)$': '<rootDir>/src/storage/db$1',
		// '^@src/(.*)$': '<rootDir>/src/$1',
		'^@log$': '<rootDir>/src/logger',
		...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' })
	},
	collectCoverage: false,
	collectCoverageFrom: [
		'<rootDir>/src/**/*.{js,jsx,ts}',
		'!**/coverage/**',
		'!**/assets/**',
		'!**/config/**',
		'!**/coverage/**',
		'!node_modules/**',
		'!babel.config.js',
		'!jest.config.js ',
		'!app.config.js',
		'!metro.config.js',
		'!react-native.config.js',
		'!<rootDir>/src/styles/**',
		'!<rootDir>/src/consts/**',
		'!<rootDir>/src/components/**',
		'!<rootDir>/src/AppEntry.ts',
		'!<rootDir>/src/storage/store/AsyncStore.ts',
		'!<rootDir>/src/storage/store/SecureStore.ts',
	],
	// verbose: true,
})

