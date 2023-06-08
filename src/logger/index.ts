import { env } from '@src/consts'
import { isReactotronRunnig } from '@src/services/reactotron'

/* function _log(
	withTime: boolean,
	withCallerName: boolean,
	withPath: boolean,
	msg?: unknown,
	...optionalParams: unknown[]
) {
	let prefix = ''
	if(withTime) { prefix += `[${new Date().toLocaleTimeString()}]` }
	if (withCallerName) { prefix += `[${callerInfo()?.name}]` }
	if (withPath) { prefix += `[${callerInfo()?.path}]` }
	// eslint-disable-next-line no-console
	console.log(prefix, msg, ...optionalParams)
} */
export function l(msg?: unknown, ...optionalParams: unknown[]) {
	if (env.NODE_ENV === 'production') { return }
	if (env.DEBUG === 'full') { return debug(msg, ...optionalParams) }
	let fnName = callerInfo()?.name
	if (!fnName || fnName === '?anon_0_') { fnName = '' }
	if (fnName) { fnName = `[${fnName}]` }

	/* (isReactotronRunnig
		// eslint-disable-next-line no-console
		? console?.tron?.log || console.log
		// eslint-disable-next-line no-console
		: console.log
	) */
	// eslint-disable-next-line no-console
	console.log(`[${new Date().toLocaleTimeString()}]${fnName}`,
		msg,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		...optionalParams
	)
	if (isReactotronRunnig) {
		// eslint-disable-next-line no-console
		console.tron?.log?.(`[${new Date().toLocaleTimeString()}]${fnName}`,
			msg,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			...optionalParams
		)
		// eslint-disable-next-line no-console
		// console?.tron?.error?.([msg, optionalParams], '[ERROR]')
	}
}

function debug(msg?: unknown, ...optionalParams: unknown[]) {
	warn(
		`[${callerInfo()?.name}]`,
		msg,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		...optionalParams
	)
}
/* export function log(msg: unknown, ...args: unknown[]) {
	// eslint-disable-next-line no-console
	console.log(`[${new Date().toLocaleTimeString()}]`, msg, ...args)
} */

export function warn(msg: unknown, ...args: unknown[]) {
	// eslint-disable-next-line no-console
	console.warn(`[${new Date().toLocaleTimeString()}]`, msg, ...args)
}

export function callerInfo(skipOf = 3) {
	skipOf = skipOf || 3
	let eStack
	try { eStack = new Error().stack } catch (err) { l('kaka', undefined) }
	// const arr = eStack?.split('at ').map(x => x?.split(' (')[0]?.split(' ('))
	// log( arr?.slice(1,5),eStack)
	// console.log(eStack?.split('at '), '\n', eStack?.split('at ')[skipOf])
	let tmpv = eStack?.split('at ')[skipOf]?.split(')\n')[0]?.split(' (')
	if (!tmpv || !tmpv[1] || !tmpv[0]) { tmpv = eStack?.split('at ')[skipOf + 1]?.split(')\n')[0]?.split(' (') }
	/* const error = new Error('')
	// console.log(error.stack, '\n', '\n')
	if (error.stack) {
		const cla = error.stack.split('\n')
		let idx = 1
	
		console.log(idx, '----------------', cla[idx])
		while (idx < cla.length && cla[idx].includes('callerInfo')) { idx++ }
		if (idx < cla.length) {
			a = cla[idx].slice(cla[idx].indexOf('at ') + 3, cla[idx].length)
		}
	}
	if (!tmpv || !tmpv[1] || tmpv[1] === undefined) { console.log(eStack?.stack) }*/
	if (tmpv) { return { name: tmpv[0].replace('Object.exports.', '').replace('Object.', ''), path: tmpv[1] } }
	return null
}