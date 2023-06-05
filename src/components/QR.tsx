import { StyleSheet, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

interface QRProps {
	size: number
	value: string
	onError: () => void
}

export default function QR({ size, value, onError }: QRProps) {
	return (
		<View style={styles.qrWrap}>
			<QRCode
				size={size}
				value={value}
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				logo={require('../../assets/adaptive-icon.png')}
				logoBorderRadius={10}
				logoBackgroundColor='#fafafa'
				logoMargin={3}
				onError={onError}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	qrWrap: {
		borderWidth: 5,
		borderColor: '#FFF'
	}
})