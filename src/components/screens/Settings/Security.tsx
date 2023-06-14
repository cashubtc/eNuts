import usePrompt from '@comps/hooks/Prompt'
import { ChevronRightIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { getProofs } from '@db'
import { getBackUpToken } from '@db/backup'
import { l } from '@log'
import { PromptModal } from '@modal/Prompt'
import type { TSecuritySettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export default function SecuritySettings({ navigation, route }: TSecuritySettingsPageProps) {
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
			<View style={[globals(color).wrapContainer, styles.wrap]}>
				<TouchableOpacity
					style={styles.settingsRow}
					onPress={() => { void handleBackup() }}
				>
					<Txt txt='Create a backup token' />
					<ChevronRightIcon color={color.TEXT} />
				</TouchableOpacity>
			</View>
			<BottomNav navigation={navigation} route={route} />
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
		paddingVertical: 10,
	},
})