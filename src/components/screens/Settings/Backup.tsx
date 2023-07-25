import BackupSuccess from '@comps/Backup'
import Container from '@comps/Container'
import type { TBackupPageProps } from '@model/nav'
import { useTranslation } from 'react-i18next'

export default function BackupPage({ navigation, route }: TBackupPageProps) {
	const { t } = useTranslation(['topNav'])
	return (
		<Container
			screenName={t('backup')}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<BackupSuccess token={route.params.token} />
		</Container>
	)
}