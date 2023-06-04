import BackupSuccess from '@comps/Backup'
import type { TMintBackupPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { useContext } from 'react'
import { StyleSheet,View } from 'react-native'

export default function MintBackup({ navigation, route }: TMintBackupPageProps) {
	const { color } = useContext(ThemeContext)
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav
				withBackBtn
				backHandler={() => navigation.goBack()}
			/>
			<BackupSuccess
				token={route.params.token}
				mint={route.params.mint_url}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 130,
		paddingHorizontal: 20,
	},
})