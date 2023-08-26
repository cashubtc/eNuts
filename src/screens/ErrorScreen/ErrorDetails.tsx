import Txt from '@comps/Txt'
import { repoIssueUrl } from '@consts/urls'
import { usePromptContext } from '@src/context/Prompt'
import { NS } from '@src/i18n'
import { mainColors } from '@src/styles'
import { isErr, openUrl } from '@util'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export interface ErrorDetailsProps {
	error: Error
	componentStack: string | null
	eventId: string | null
	resetError(): void
}

export function ErrorDetails(props: ErrorDetailsProps) {
	const { t } = useTranslation([NS.error])
	const { openPromptAutoClose } = usePromptContext()
	return (
		<View style={styles.container}>
			<Text style={styles.header}>
				{t('header')}!
			</Text>
			<Txt
				txt={t('msg')}
				styles={[{ marginBottom: 20 }]}
			/>
			<ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
				<Txt txt={props.error.message} styles={[{ color: mainColors.RED }]} />
				<Txt txt={props?.componentStack || t('stackNA')} />
			</ScrollView>
			<TouchableOpacity
				onPress={() => void openUrl(repoIssueUrl)?.catch((err: unknown) =>
					openPromptAutoClose({ msg: isErr(err) ? err.message : t('deepLinkErr', { ns: NS.common }) }))}
				style={styles.bugReport}
			>
				<Text style={styles.bugTxt}>
					{t('reportBug')}{'  '}🐛
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