import type { Buffer } from 'buffer/'

declare module '@gandlaf21/bolt11-decode' {
	export type ValueUnion = IRouteHintEntry[] | IValue | number | string | Buffer;

	export interface IRouteHintEntry {
		pubkey: string;
		short_channel_id: string;
		fee_base_msat: number;
		fee_proportional_millionths: number;
		cltv_expiry_delta: number;
	}

	export interface IValue {
		bech32?: string;
		pubKeyHash?: number;
		scriptHash?: number;
		validWitnessVersions?: number[];
		extra_bits?: any;
		var_onion_optin?: string;
		payment_secret?: string;
		basic_mpp?: string;
	}
	export interface ISectionEntry {
		name: string;
		letters: string;
		value?: ValueUnion;
		tag?: string;
		payment_hash?:string
	}
	declare function decode(paymentRequest: string, network?: any): {
		paymentRequest: string;
		sections: ISectionEntry[];
		readonly expiry: number;
		readonly route_hints: IRouteHintEntry[];
	}
}