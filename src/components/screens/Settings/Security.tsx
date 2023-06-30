import usePrompt from '@comps/hooks/Prompt'
import { ChevronRightIcon } from '@comps/Icons'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import { getProofs } from '@db'
import { getBackUpToken } from '@db/backup'
import type { TSecuritySettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export default function SecuritySettings({ navigation, route }: TSecuritySettingsPageProps) {
	const { t } = useTranslation()
	const { color } = useContext(ThemeContext)
	const { prompt, openPromptAutoClose } = usePrompt()
	const handleBackup = async () => {
		try {
			const proofs = await getProofs()
			if (!proofs.length) {
				openPromptAutoClose({ msg: t('common.noProofsToBackup') })
				return
			}
			const token = await getBackUpToken()
			navigation.navigate('BackupPage', { token })
		} catch (e) {
			openPromptAutoClose({ msg: t('common.backupErr') })
		}
	}
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName={t('topNav.security')} withBackBtn />
			<View style={globals(color).wrapContainer}>
				<TouchableOpacity
					style={styles.settingsRow}
					onPress={() => { void handleBackup() }}
				>
					<Txt txt={t('common.createBackup')} />
					<ChevronRightIcon color={color.TEXT} />
				</TouchableOpacity>
			</View>
			<BottomNav navigation={navigation} route={route} />
			{prompt.open && <Toaster txt={prompt.msg} /> }
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 110,
	},
	settingsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 20,
	},
})