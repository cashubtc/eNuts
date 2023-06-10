import { ErrorInfo } from 'react'
import { Button, ScrollView, View } from 'react-native'


export interface ErrorDetailsProps {
	error: Error
	errorInfo: ErrorInfo | null
	onReset(): void
}

export function ErrorDetails(props: ErrorDetailsProps) {
	{/* <Screen
			preset="fixed"
			safeAreaEdges={['top', 'bottom']}
			contentContainerStyle={$contentContainer}
		> */}
	return (
		<>
			<View>
				{/* 		<Icon icon="ladybug" size={64} />
				<Text style={$heading} preset="subheading" tx="errorScreen.title" />
				<Text tx="errorScreen.friendlySubtitle" /> */}
			</View>

			<ScrollView>
				{/* 	<Text style={$errorContent} weight="bold" text={`${props.error}`.trim()} />
				<Text
					selectable
					style={$errorBacktrace}
					text={`${props.errorInfo.componentStack}`.trim()}
				/> */}
			</ScrollView>

			<Button
				// preset="reversed"
				// style={$resetButton}
				onPress={() => props.onReset()}
				title="errorScreen.reset"
			/>
		</>
	)
}

