import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'

export default function PinHint({ confirm, login }: { confirm?: boolean, login?: boolean }) {
	const { t } = useTranslation()
	return (
		<>
			{(login || !confirm) &&
				<Text style={styles.welcome}>
					{login ?
						'Welcome back!'
						:
						'Welcome'
					}
				</Text>
			}
			<Text style={styles.txt}>
				{!login && !confirm ?
					t('pinSetup')
					:
					confirm ? t('pleaseConfirm') : t('pleaseEnter')
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