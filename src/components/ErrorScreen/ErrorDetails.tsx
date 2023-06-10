import Button from '@comps/Button'
import Txt from '@comps/Txt'
import { repoIssueUrl } from '@consts/urls'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { openUrl } from '@util'
import { ErrorInfo, useContext } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

export interface ErrorDetailsProps {
	error: Error
	errorInfo: ErrorInfo | null
	onReset(): void
}

export function ErrorDetails(props: ErrorDetailsProps) {
	const { color, highlight } = useContext(ThemeContext)
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<Text style={globals(color, highlight).modalHeader}>
				An error occured!
			</Text>
			<Txt
				txt='We are sorry that you encountered this problem. You can help us improve the software by taking a screenshot and creating a short bug report.'
				styles={[{ textAlign: 'center', marginBottom: 20 }]}
			/>
			<ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
				<Txt txt={props.error.message} styles={[{ color: color.ERROR }]} />
				<Txt txt={props.errorInfo?.componentStack || 'Error stack not available'} />
			</ScrollView>
			<Button
				txt='Bug report'
				onPress={() => void openUrl(repoIssueUrl)}
			/>
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
	scroll: {
		marginBottom: 20,
	}
})