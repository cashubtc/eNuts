import BackupSuccess from '@comps/Backup'
import type { TMintBackupPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export default function MintBackup({ route }: TMintBackupPageProps) {
	const { t } = useTranslation(['topNav'])
	const { color } = useContext(ThemeContext)
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName={t('mintBackup')} withBackBtn />
			<BackupSuccess
				token={route.params.token}
				mint={route.params.mintUrl}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 100,
	},
})