import { NS } from '@src/i18n'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'

interface IPinHintProps {
	confirm?: boolean
	login?: boolean
	shouldEdit?: boolean
	shouldRemove?: boolean
}

export default function PinHint({ confirm, login, shouldEdit, shouldRemove }: IPinHintProps) {
	const { t } = useTranslation([NS.auth])
	const getRightHeaderTxt = () => {
		if (login && !shouldEdit && !shouldRemove) { return t('welcomeBack') }
		if (shouldRemove) { return t('removePin') }
		if (shouldEdit) { return t('editPin') }
		return t('welcome')
	}
	const getRightTxt = () => {
		if (!login && !confirm && !shouldEdit && !shouldRemove) { return t('pinSetup') }
		if (confirm && !shouldEdit && !shouldRemove) { return t('pleaseConfirm') }
		if (login && (shouldRemove || shouldEdit)) { return t('confirmAction') }
		if (!login && shouldEdit && !confirm) { return t('pleaseNewPin') }
		if (!login && shouldEdit && confirm) { return t('pleaseConfirmNewPin') }
		return t('pleaseEnter')
	}
	return (
		<>
			{!confirm &&
				<Text style={styles.welcome}>
					{getRightHeaderTxt()}
				</Text>
			}
			<Text style={styles.txt}>
				{getRightTxt()}
			</Text>
		</>
	)
}

const styles = StyleSheet.create({
	welcome: {
		fontSize: 22,
		color: '#FAFAFA',
		marginVertical: 10,
	},
	txt: {
		fontSize: 14,
		color: '#FAFAFA',
		textAlign: 'center',
		marginBottom: 20,
	},
})