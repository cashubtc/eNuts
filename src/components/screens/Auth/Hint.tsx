import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'

export default function PinHint({ confirm, login }: { confirm?: boolean, login?: boolean }) {
	const { t } = useTranslation()
	return (
		<>
			{(login || !confirm) &&
				<Text style={styles.welcome}>
					{login ?
						t('auth.welcomeBack')
						:
						t('auth.welcome')
					}
				</Text>
			}
			<Text style={styles.txt}>
				{!login && !confirm ?
					t('auth.pinSetup')
					:
					confirm ? t('auth.pleaseConfirm') : t('auth.pleaseEnter')
				}
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