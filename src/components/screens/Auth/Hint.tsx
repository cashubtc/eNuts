import { getTranslationLangCode } from '@util/localization'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'

interface IPinHintProps {
	confirm?: boolean
	login?: boolean
	shouldEdit?: boolean
	shouldRemove?: boolean
}

export default function PinHint({ confirm, login, shouldEdit, shouldRemove }: IPinHintProps) {
	const { t } = useTranslation(getTranslationLangCode())
	const getRightHeaderTxt = () => {
		if (login && !shouldEdit && !shouldRemove) { return t('auth.welcomeBack') }
		if (shouldRemove) { return t('auth.removePin') }
		if (shouldEdit) { return t('auth.editPin') }
		return t('auth.welcome')
	}
	const getRightTxt = () => {
		if (!login && !confirm && !shouldEdit && !shouldRemove) { return t('auth.pinSetup') }
		if (confirm && !shouldEdit && !shouldRemove) { return t('auth.pleaseConfirm') }
		if (login && (shouldRemove || shouldEdit)) { return t('auth.confirmAction') }
		if (!login && shouldEdit && !confirm) { return t('auth.pleaseNewPin') }
		if (!login && shouldEdit && confirm) { return t('auth.pleaseConfirmNewPin') }
		return t('auth.pleaseEnter')
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