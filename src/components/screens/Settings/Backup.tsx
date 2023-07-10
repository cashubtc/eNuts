import BackupSuccess from '@comps/Backup'
import type { TBackupPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export default function BackupPage({ route }: TBackupPageProps) {
	const { t } = useTranslation(['topNav'])
	const { color } = useContext(ThemeContext)
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName={t('backup', { ns: 'topNav' })} withBackBtn />
			<BackupSuccess token={route.params.token} />
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 100,
	},
})