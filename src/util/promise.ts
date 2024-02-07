if (typeof global?.Promise.allSettled === 'undefined') {
	global.Promise.allSettled = function <T extends readonly unknown[] | []>(promises: Promise<T>[]): Promise<PromiseSettledResult<T>[]> {
		const mappedPromises: Promise<PromiseSettledResult<T>>[] = promises.map(p => p
			.then(value => Promise.resolve({
				status: 'fulfilled',
				value,
			}) as Promise<PromiseSettledResult<T>>)
			.catch((reason) => ({
				status: 'rejected',
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				reason,
			}) as PromiseRejectedResult))
		return Promise.all(mappedPromises)
	}
}
