import BackupSuccess from '@comps/Backup'
import Screen from '@comps/Screen'
import type { TMintBackupPageProps } from '@model/nav'
import { useTranslation } from 'react-i18next'

export default function MintBackup({ navigation, route }: TMintBackupPageProps) {
	const { t } = useTranslation(['topNav'])
	return (
		<Screen
			screenName={t('mintBackup')}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<BackupSuccess
				token={route.params.token}
				mint={route.params.mintUrl}
			/>
		</Screen>
	)
}