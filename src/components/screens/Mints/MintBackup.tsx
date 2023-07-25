import BackupSuccess from '@comps/Backup'
import Container from '@comps/Container'
import type { TMintBackupPageProps } from '@model/nav'
import { useTranslation } from 'react-i18next'

export default function MintBackup({ navigation, route }: TMintBackupPageProps) {
	const { t } = useTranslation(['topNav'])
	return (
		<Container
			screenName={t('mintBackup')}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<BackupSuccess
				token={route.params.token}
				mint={route.params.mintUrl}
			/>
		</Container>
	)
}