import { getRandomBytes, getRandomValues } from 'expo-crypto'

// eslint-disable-next-line no-console
console.log('shim.ts')



if (typeof global?.Crypto === 'undefined' &&
	typeof global?.crypto === 'undefined' &&
	typeof global?.window?.crypto === 'undefined') {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	global.crypto = { getRandomValues, getRandomBytes }
}
/* if (typeof Buffer === 'undefined') {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-var-requires
	global.Buffer = require('buffer/').Buffer as typeof import('buffer').Buffer
} 
if (typeof __dirname === 'undefined') { global.__dirname = '/' }
if (typeof __filename === 'undefined') { global.__filename = '' }
*/
