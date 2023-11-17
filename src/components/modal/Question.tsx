import Button, { TxtButton } from '@comps/Button'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { useTranslation } from 'react-i18next'
import { Text } from 'react-native'

import MyModal from '.'

interface IQuestionModalProps {
	header?: string
	txt?: string
	visible: boolean
	confirmTxt?: string
	confirmFn: () => void
	cancelTxt?: string
	cancelFn: () => void
}

export function BottomModal({ header, txt, visible, confirmTxt, confirmFn, cancelTxt, cancelFn }: IQuestionModalProps) {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	return (
		<MyModal type='bottom' animation='slide' visible={visible} close={cancelFn} >
			<Text style={[globals(color).modalHeader, !txt?.length ? { marginBottom: 0 } : {}]}>
				{header}
			</Text>
			<Text style={globals(color).modalTxt}>
				{txt}
			</Text>
			<Button txt={confirmTxt || t('yes')} onPress={confirmFn} />
			<TxtButton
				txt={cancelTxt || t('no')}
				onPress={cancelFn}
				style={[{ paddingBottom: 20 }]}
			/>
		</MyModal>
	)
}
