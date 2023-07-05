import { StyleSheet,Text } from 'react-native'

export default function PinHint({ confirm, login }: { confirm?: boolean, login?: boolean }) {
	return (
		<>
			{(login || !confirm) &&
				<Text style={styles.welcome}>
					Welcome{login ? ' back' : ''}
				</Text>
			}
			<Text style={styles.txt}>
				{!login && !confirm ?
					'You can setup a PIN to secure your app.'
					:
					`Please ${confirm ? 'confirm' : 'enter'} your PIN now.`
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