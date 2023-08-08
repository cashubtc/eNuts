import BackupSuccess from '@comps/Backup'
import Screen from '@comps/Screen'
import type { TBackupPageProps } from '@model/nav'
import { useTranslation } from 'react-i18next'

export default function BackupPage({ navigation, route }: TBackupPageProps) {
	const { t } = useTranslation(['topNav'])
	return (
		<Screen
			screenName={t('backup')}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<BackupSuccess token={route.params.token} />
		</Screen>
	)
}