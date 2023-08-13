import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { isErr, openUrl } from '@util'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'

import Button from './Button'
import MyModal from './modal'

interface ILeaveAppModalProps {
	url: string
	visible: boolean
	closeModal: () => void
}

export default function LeaveAppModal({ url, visible, closeModal }: ILeaveAppModalProps ) {
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const { openPromptAutoClose } = usePromptContext()
	const handleContinue = async () => {
		closeModal()
		await openUrl(url)?.catch(e => openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') }))
	}
	return (
		<>
			<MyModal type='bottom' animation='slide' visible={visible} close={closeModal}>
				<Text style={globals(color, highlight).modalHeader}>
					{t('aboutToLeaveTo')}
				</Text>
				<Text style={globals(color, highlight).modalTxt}>
					&quot;{url}&quot;
				</Text>
				<Button txt={t('continue')} onPress={() => void handleContinue()} />
				<TouchableOpacity onPress={closeModal}>
					<Text style={[globals(color, highlight).pressTxt, styles.cancel]}>
						{t('cancel')}
					</Text>
				</TouchableOpacity>
			</MyModal>
		</>
	)
}

const styles = StyleSheet.create({
	cancel: {
		marginTop: 25,
	},
})