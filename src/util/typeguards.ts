import { Buffer } from 'buffer/'

export function isStr(v: unknown): v is string { return typeof v === 'string' }
export function isNum(v: unknown): v is number { return typeof v === 'number' }
export function isObj(v: unknown): v is object { return typeof v === 'object' }
// eslint-disable-next-line @typescript-eslint/ban-types
export function isFunc(v: unknown): v is Function { return typeof v === 'function' }
export function isBool(v: unknown): v is boolean { return typeof v === 'boolean' }
export function isUndef(v: unknown): v is undefined { return typeof v === 'undefined' }
export function isNull(v: unknown): v is null { return v === null }
export function isArr(v: unknown): v is unknown[] { return Array.isArray(v) }
export function isErr(v: unknown): v is Error { return v instanceof Error }
export function isBuf(v: unknown): v is Buffer { return Buffer.isBuffer(v) }
export function isNonNullable<T>(v: T): v is NonNullable<T> { return !isNull(v) && !isUndef(v) }
export function isArrOf<T>(elemGuard: (x: unknown) => x is T) {
	return (arr: unknown[]): arr is T[] => arr.every(elemGuard)
}
export function isArrOfStr(arr: unknown[]): arr is string[]{ return arr.every(isStr) }
export function isArrOfNum(arr: unknown[]): arr is number[] { return arr.every(isNum) }
export function isArrOfObj(arr: unknown[]): arr is object[] { return arr.every(isObj) }
export function isArrOfNonNullable<T>(arr: unknown[]): arr is NonNullable<T>[] {
	return arr.every(isNonNullable)
}