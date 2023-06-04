export interface IDecodedLNInvoice {
	paymentRequest: string
	sections: any[]
	readonly expiry: number
	readonly route_hints: any[]
}