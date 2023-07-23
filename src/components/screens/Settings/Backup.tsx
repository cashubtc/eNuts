import BackupSuccess from '@comps/Backup'
import Container from '@comps/Container'
import type { TBackupPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { useTranslation } from 'react-i18next'

export default function BackupPage({ route }: TBackupPageProps) {
	const { t } = useTranslation(['topNav'])
	return (
		<Container>
			<TopNav screenName={t('backup')} withBackBtn />
			<BackupSuccess token={route.params.token} />
		</Container>
	)
}