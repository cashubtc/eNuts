

export interface IBody {
	json<T>(): Promise<T>
}
declare global {
	namespace NodeJS {
		interface Body extends IBody {
			json<T>(): Promise<T>
		}
	}
	export interface Body extends IBody {
		json<T>(): Promise<T>
	}
}
declare global {
	interface Body extends IBody {
		json<T>(): Promise<T>
	}
}
