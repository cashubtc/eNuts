import { NS } from '@src/i18n'
import { mainColors } from '@src/styles'
import { useTranslation } from 'react-i18next'
import { Text } from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'

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

const styles = ScaledSheet.create({
	welcome: {
		fontSize: '20@vs',
		color: mainColors.WHITE,
		marginVertical: '10@vs',
	},
	txt: {
		fontSize: '12@vs',
		color: mainColors.WHITE,
		textAlign: 'center',
		marginBottom: '20@vs',
		paddingHorizontal: '20@s',
	},
})