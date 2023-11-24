import { NS } from '@src/i18n'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { s, vs } from 'react-native-size-matters'

import Button from './Button'
import MyModal from './modal'
import QR from './QR'
import Txt from './Txt'

interface IQRModalProps {
	visible: boolean
	value: string
	error?: boolean
	isInvoice?: boolean
	truncateNum?: number
	close: () => void
	onError: () => void
}

export default function QRModal({
	visible,
	value,
	error,
	isInvoice,
	truncateNum,
	close,
	onError
}: IQRModalProps) {
	const { t } = useTranslation([NS.common])
	return (
		<MyModal type='bottom' animation='slide' visible={visible} close={close}>
			<View style={{ marginBottom: vs(20) }} />
			{error ?
				<Txt txt={t('bigQrMsg')} styles={[{ textAlign: 'center' }]} />
				:
				<QR
					value={value}
					size={s(280)}
					onError={onError}
					isInvoice={isInvoice}
					truncateNum={truncateNum}
				/>
			}
			<View style={{ marginVertical: vs(10) }} />
			<Button
				outlined
				txt='OK'
				onPress={close}
			/>
		</MyModal>
	)
}