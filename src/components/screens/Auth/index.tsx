import { ThemeContext } from '@src/context/Theme'
import { globals, highlight as hi } from '@styles'
import { useContext } from 'react'
import { StyleSheet, Text, View } from 'react-native'

export default function AuthPage() {
	const { color, highlight } = useContext(ThemeContext)
	return (
		/* this is the initial pin setup page */
		<View style={[styles.container, { backgroundColor: hi[highlight] }]}>
			<Text style={styles.welcome}>
				Welcome
			</Text>
			<Text style={styles.txt}>
				You can setup a PIN to secure your app or skip this process.
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	welcome: {
		fontSize: 28,
		fontWeight: '500',
		color: '#FAFAFA',
		marginBottom: 10,
	},
	txt: {
		fontSize: 16,
		color: '#FAFAFA',
		textAlign: 'center',
	},
})