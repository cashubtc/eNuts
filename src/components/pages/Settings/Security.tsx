import usePrompt from '@comps/hooks/Prompt'
import { ChevronRightIcon } from '@comps/Icons'
import { getProofs } from '@db'
import { getBackUpToken } from '@db/backup'
import { l } from '@log'
import { PromptModal } from '@modal/Prompt'
import { TSecuritySettingsPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function SecuritySettings({ navigation }: TSecuritySettingsPageProps) {
	const { color } = useContext(ThemeContext)
	const { prompt, openPrompt, closePrompt } = usePrompt()
	const handleBackup = async () => {
		try {
			const proofs = await getProofs()
			if (!proofs.length) {
				openPrompt('Found no proofs to create a backup.')
				return
			}
			const token = await getBackUpToken()
			navigation.navigate('BackupPage', { token })
		} catch (e) {
			l(e)
			openPrompt('Something went wrong while creating the backup token.')
		}
	}
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav
				screenName='Security'
				withBackBtn
				backHandler={() => navigation.navigate('Settings')}
			/>
			<View style={[styles.wrap, { backgroundColor: color.INPUT_BG, borderColor: color.BORDER }]}>
				<TouchableOpacity
					style={styles.settingsRow}
					onPress={() => { void handleBackup() }}
				>
					<Text style={globals(color).txt}>
						Create a backup token
					</Text>
					<ChevronRightIcon color={color.TEXT} />
				</TouchableOpacity>
			</View>
			{/* <View style={[styles.separator, { borderBottomColor: color.BORDER }]} /> */}
			<PromptModal
				header={prompt.msg}
				visible={prompt.open}
				close={closePrompt}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 120,
	},
	settingsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 10,
	},
	wrap: {
		borderWidth: 1,
		borderRadius: 20,
		paddingHorizontal: 20,
		paddingVertical: 10,
	},
	// separator: {
	// 	borderBottomWidth: 1,
	// 	marginVertical: 10,
	// },
})