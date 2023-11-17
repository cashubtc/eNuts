import MyModal from '@modal'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { useTranslation } from 'react-i18next'
import { Text } from 'react-native'

import Button, { TxtButton } from './Button'

interface IInitialModalProps {
	visible: boolean
	onConfirm: () => void
	onCancel: () => void
}

export default function InitialModal({ visible, onConfirm, onCancel }: IInitialModalProps) {
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	return (
		<MyModal type='bottom' animation='slide' visible={visible} close={onCancel}>
			<Text style={globals(color, highlight).modalHeader}>
				{t('getStarted')}
			</Text>
			<Text style={globals(color, highlight).modalTxt}>
				{t('startHint')}
			</Text>
			<Button txt={t('addEnutsMint')} onPress={onConfirm} />
			<TxtButton
				txt={t('addMintUrl')}
				onPress={onCancel}
				style={[{ paddingTop: 25, paddingBottom: 10, }]}
			/>
		</MyModal>
	)
}