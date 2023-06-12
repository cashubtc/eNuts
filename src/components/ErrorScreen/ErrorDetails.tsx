import Txt from '@comps/Txt'
import { repoIssueUrl } from '@consts/urls'
import { openUrl } from '@util'
import { ErrorInfo } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity,View } from 'react-native'

export interface ErrorDetailsProps {
	error: Error
	errorInfo: ErrorInfo | null
	onReset(): void
}

export function ErrorDetails(props: ErrorDetailsProps) {
	return (
		<View style={styles.container}>
			<Text style={styles.header}>
				An error occured!
			</Text>
			<Txt
				txt='We are sorry that you encountered this problem. You can help us improve the software by taking a screenshot and creating a short bug report.'
				styles={[{ marginBottom: 20 }]}
			/>
			<ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
				<Txt txt={props.error.message} styles={[{ color: '#FF6666' }]} />
				<Txt txt={props.errorInfo?.componentStack ?? 'Error stack not available'} />
			</ScrollView>
			<TouchableOpacity
				onPress={() => void openUrl(repoIssueUrl)}
				style={styles.bugReport}
			>
				<Text style={styles.bugTxt}>
					Report the bug{'  '}🐛
				</Text>
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingBottom: 20,
		paddingTop: 80,
	},
	header: {
		fontSize: 24,
		fontWeight: '500',
		marginBottom: 30,
		textAlign: 'center',
	},
	scroll: {
		marginBottom: 20,
	},
	bugReport: {
		padding: 20,
	},
	bugTxt: {
		fontSize: 16,
		fontWeight: '500',
		textAlign: 'center',
	}
})