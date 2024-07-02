/** @type {Detox.DetoxConfig} */
module.exports = {
	logger: {
		level: process.env.CI ? 'debug' : undefined
	},
	testRunner: {
		args: {
			$0: 'jest',
			config: './test/e2e/jest.config.ts',
			_: ['e2e']
		}
	},
	artifacts: {
		rootDir: '.artifacts',
		plugins: {
			log: process.env.CI ? 'failing' : undefined,
			screenshot: 'failing'
		}
	},
	apps: {
		'ios.release': {
			type: 'ios.app',
			build:
				'xcodebuild -workspace ios/eastestsexample.xcworkspace -scheme eastestsexample -configuration Release -sdk iphonesimulator -arch x86_64 -derivedDataPath ios/build',
			binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/eastestsexample.app'
		},
		'android.release': {
			type: 'android.apk',
			build: 'cd android && ./gradlew clean :app:assembleRelease :app:assembleAndroidTest -DtestBuildType=release && cd ..',
			binaryPath: 'android/app/build/outputs/apk/release/app-release.apk'
		},
	},
	devices: {
		simulator: {
			type: 'ios.simulator',
			device: {
				type: 'iPhone 14'
			}
		},
		emulator: {
			type: 'android.emulator',
			device: {
				// avdName: 'Pixel_7_Pro_API_34'
				avdName: 'Pixel_API_21'
			}
		}
	},
	configurations: {
		'ios.release': {
			device: 'simulator',
			app: 'ios.release'
		},
		'android.emu.release': {
			device: 'emulator',
			app: 'android.release'
		}
	}
}
