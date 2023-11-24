import { truncateStr } from '@nostr/util'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { mainColors } from '@src/styles'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { s, ScaledSheet } from 'react-native-size-matters'

import useCopy from './hooks/Copy'
import { CheckmarkIcon, CopyIcon } from './Icons'
import Txt from './Txt'

interface QRProps {
	size: number
	value: string
	isInvoice?: boolean
	truncateNum?: number
	onError: () => void
}

export default function QR({ size, value, isInvoice, truncateNum, onError }: QRProps) {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const { copied, copy } = useCopy()
	const str = isInvoice ? value.toUpperCase() : value
	return (
		<TouchableOpacity onPress={() => void copy(str)}>
			<View style={styles.qrWrap}>
				<QRCode
					size={size}
					value={str}
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					logo={require('@assets/app-qr-icon.png')}
					logoBorderRadius={10}
					logoBackgroundColor={mainColors.WHITE}
					logoMargin={s(6)}
					onError={onError}
				/>
			</View>
			<View style={[styles.txtContainer, { borderColor: color.BORDER, backgroundColor: color.INPUT_BG }]}>
				<View style={styles.iconCon}>
					{copied ?
						<CheckmarkIcon color={mainColors.VALID} />
						:
						<CopyIcon color={color.TEXT} />
					}
				</View>
				<Txt
					txt={copied ? t('copied') : truncateStr(str, truncateNum ?? 20)}
					styles={[{ color: copied ? mainColors.VALID : color.TEXT }]}
				/>
			</View>
		</TouchableOpacity>
	)
}

const styles = ScaledSheet.create({
	qrWrap: {
		borderWidth: '10@s',
		borderColor: mainColors.WHITE,
		borderTopLeftRadius: 10,
		borderTopRightRadius: 10,
	},
	txtContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '15@s',
		borderWidth: 1,
		borderBottomLeftRadius: 10,
		borderBottomRightRadius: 10,
	},
	iconCon: {
		minWidth: '30@s'
	}
})