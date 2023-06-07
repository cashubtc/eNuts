import type { IMintBalWithName } from '@model'
import { _mintUrl } from '@wallet'

export const defaultMints: IMintBalWithName[] = [
	/* {
		mint_url: 'https://8333.space:3338',
		amount: 0,
		customName: ''
	},
	{
		mint_url: 'https://legend.lnbits.com/cashu/api/v1/TGM7mVpYBkva7sCqLECTk5',
		amount: 0,
		customName: ''
	}, */
	{
		mint_url: _mintUrl,
		amount: 0,
		customName: ''
	}
]

// https://reactnative.dev/docs/platform
// export const osAndroid = 'android'
// export const osIOS = 'ios'

// const PATTERN = [1000, 2000, 3000]
// Android: wait 1s -> vibrate 2s -> wait 3s
// iOS: wait 1s -> vibrate -> wait 2s -> vibrate -> wait 3s -> vibrate
// const androidSuccessVibrationPattern = [0, 100, 0, 100, 0, 300]
// const iosSuccessVibrationPattern = [0, 100, 100, 100]
// export const successPattern = Platform.OS === osAndroid ? androidSuccessVibrationPattern : iosSuccessVibrationPattern