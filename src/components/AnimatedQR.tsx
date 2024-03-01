import { UR, UREncoder } from '@gandlaf21/bc-ur'
import { mainColors } from '@src/styles'
import { Buffer } from 'buffer'
import { useEffect, useRef, useState } from 'react'
import QRCode, { QRCodeProps } from 'react-native-qrcode-svg'
import { s } from 'react-native-size-matters'
import Txt from './Txt'

export interface AnimatedQR extends QRCodeProps {
	value: string;
	interval: number;
	chunkLength: number;
	size?: number; // defaults to 128
	onError: ()=>void

}

export function AnimatedQR({
	value,
	interval,
	chunkLength,
	size,
	onError

}: AnimatedQR) {
	const [part, setPart] = useState<string>('')

	const firstSeqNum = 0
	const ur = UR.fromBuffer(Buffer.from(value))
	const encoder = useRef<UREncoder>(new UREncoder(ur, chunkLength, firstSeqNum))


	useEffect(() => {
		let timer: NodeJS.Timeout
		if (value) {
			timer = setInterval(() => {
				setPart(encoder.current.nextPart())
				console.log(part)
			}, interval)
		}
		return () => {
			if (timer) {
				clearInterval(timer)
			}
		}
	}, [value, chunkLength, interval, part])
	return (
		<>
		<Txt txt={part}></Txt>
		</>
		// <QRCode
		// 	value={part}
		// 	size={size}
		// 	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		// 	logo={require('@assets/app-qr-icon.png')}
		// 	logoBorderRadius={10}
		// 	logoBackgroundColor={mainColors.WHITE}
		// 	logoMargin={s(6)}
		// 	onError={onError}
		// />
	)
}