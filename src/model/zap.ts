import { IMintUrl } from './index'

export interface IZapReturnData {

	invoice: string
	amount: number
	estFee: number
	mintUsing: IMintUrl
	balance: number

}

export interface IZapModalProps {
	visible: boolean
	close: () => void
	onReturnData:(value: IZapReturnData) => void; 

}