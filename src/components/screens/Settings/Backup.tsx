import BackupSuccess from '@comps/Backup'
import type { TBackupPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { useContext } from 'react'
import { StyleSheet, View } from 'react-native'

export default function BackupPage({ route }: TBackupPageProps) {
	const { color } = useContext(ThemeContext)
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName='Backup' withBackBtn />
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