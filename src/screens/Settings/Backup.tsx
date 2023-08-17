import BackupSuccess from '@comps/Backup'
import Screen from '@comps/Screen'
import type { TBackupPageProps } from '@model/nav'
import { NS } from '@src/i18n'
import { useTranslation } from 'react-i18next'

export default function BackupPage({ navigation, route }: TBackupPageProps) {
	const { t } = useTranslation([NS.topNav])
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