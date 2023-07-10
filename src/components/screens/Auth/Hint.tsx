import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'

interface IPinHintProps {
	confirm?: boolean
	login?: boolean
	shouldEdit?: boolean
	shouldRemove?: boolean
}

export default function PinHint({ confirm, login, shouldEdit, shouldRemove }: IPinHintProps) {
	const { t } = useTranslation(['auth'])
	const getRightHeaderTxt = () => {
		if (login && !shouldEdit && !shouldRemove) { return t('welcomeBack', { ns: 'auth' }) }
		if (shouldRemove) { return t('removePin', { ns: 'auth' }) }
		if (shouldEdit) { return t('editPin', { ns: 'auth' }) }
		return t('welcome', { ns: 'auth' })
	}
	const getRightTxt = () => {
		if (!login && !confirm && !shouldEdit && !shouldRemove) { return t('pinSetup', { ns: 'auth' }) }
		if (confirm && !shouldEdit && !shouldRemove) { return t('pleaseConfirm', { ns: 'auth' }) }
		if (login && (shouldRemove || shouldEdit)) { return t('confirmAction', { ns: 'auth' }) }
		if (!login && shouldEdit && !confirm) { return t('pleaseNewPin', { ns: 'auth' }) }
		if (!login && shouldEdit && confirm) { return t('pleaseConfirmNewPin', { ns: 'auth' }) }
		return t('pleaseEnter', { ns: 'auth' })
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