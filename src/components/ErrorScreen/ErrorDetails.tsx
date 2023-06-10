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
			<ScrollView>
				<Text style={globals(color, highlight).modalHeader}>
					An error occured!
				</Text>
				{/* firendly subtitle */}
				<Txt txt={props.error.message} />
				<Txt txt={props.errorInfo?.componentStack || 'Error stack not available'} />
			</ScrollView>
			<Button
				txt='Report error'
				onPress={() => void openUrl(repoIssueUrl)}
			/>
			<View style={{ marginVertical: 10 }} />
			<Button
				outlined
				txt='Reset'
				onPress={() => props.onReset()}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
})