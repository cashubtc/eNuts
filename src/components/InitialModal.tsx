import MyModal from '@modal'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet,Text, TouchableOpacity } from 'react-native'

import Button from './Button'
import { getTranslationLangCode } from '@src/util/localization'

interface IInitialModalProps {
	visible: boolean
	onConfirm: () => void
	onCancel: () => void
}

export default function InitialModal({ visible, onConfirm, onCancel }: IInitialModalProps) {
	const { t } = useTranslation(getTranslationLangCode())
	const { color, highlight } = useContext(ThemeContext)
	return (
		<MyModal type='bottom' animation='slide' visible={visible} close={onCancel}>
			<Text style={globals(color, highlight).modalHeader}>
				{t('getStarted')}
			</Text>
			<Text style={globals(color, highlight).modalTxt}>
				{t('startHint')}
			</Text>
			<Button txt={t('addMintNow')} onPress={onConfirm} />
			<TouchableOpacity onPress={onCancel}>
				<Text style={[globals(color, highlight).pressTxt, styles.cancel]}>
					{t('willDoLater')}
				</Text>
			</TouchableOpacity>
		</MyModal>
	)
}

const styles = StyleSheet.create({
	cancel: {
		marginTop: 25,
	},
})