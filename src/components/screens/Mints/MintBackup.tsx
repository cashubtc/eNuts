import BackupSuccess from '@comps/Backup'
import Container from '@comps/Container'
import type { TMintBackupPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { useTranslation } from 'react-i18next'

export default function MintBackup({ route }: TMintBackupPageProps) {
	const { t } = useTranslation(['topNav'])
	return (
		<Container>
			<TopNav screenName={t('mintBackup')} withBackBtn />
			<BackupSuccess
				token={route.params.token}
				mint={route.params.mintUrl}
			/>
		</Container>
	)
}