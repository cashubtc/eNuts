import type { ITokenInfo } from '@model'
import { useThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { formatInt } from '@util'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'

import Button from './Button'
import MyModal from './modal'
import Txt from './Txt'

interface IClipboardModalProps {
	tokenInfo: ITokenInfo
	closeModal: () => void
	visible: boolean
	handleRedeem: () => void
}

export default function ClipboardModal({ visible, tokenInfo, closeModal, handleRedeem }: IClipboardModalProps) {
	const { t } = useTranslation(['common'])
	const { color, highlight } = useThemeContext()
	return (
		<MyModal type='question' visible={visible} close={closeModal}>
			<Text style={globals(color, highlight).modalHeader}>
				{t('foundCashuClipboard')}
			</Text>
			<Text style={globals(color, highlight).modalTxt}>
				{t('memo', { ns: 'history' })}: {tokenInfo.decoded.memo}{'\n'}
				<Txt
					txt={formatInt(tokenInfo.value)}
					styles={[{ fontWeight: '500' }]}
				/>
				{' '}Satoshi {t('fromMint')}:{' '}
				{tokenInfo.mints.join(', ')}
			</Text>
			<Button
				txt={t('accept')}
				onPress={handleRedeem}
			/>
			<View style={{ marginVertical: 10 }} />
			<Button
				txt={t('cancel')}
				outlined
				onPress={closeModal}
			/>
		</MyModal>
	)
}