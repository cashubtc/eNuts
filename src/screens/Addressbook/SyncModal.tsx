import Button, { TxtButton } from '@comps/Button'
import MyModal from '@comps/modal'
import Progress from '@comps/Progress'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'

interface ISyncModalProps {
	visible: boolean
	close: () => void
	status: { started: boolean, finished: boolean }
	handleSync: () => void
	handleCancel: () => void
	progress: number
	contactsCount: number
	doneCount: number
}

export default function SyncModal({
	visible,
	close,
	status,
	handleSync,
	handleCancel,
	progress,
	contactsCount,
	doneCount
}: ISyncModalProps) {

	const { t } = useTranslation([NS.addrBook])
	const { color } = useThemeContext()

	return (
		<MyModal
			type='bottom'
			animation='slide'
			visible={visible}
			close={close}
		>
			<Text style={globals(color).modalHeader}>
				{status.started ?
					t('synchronizing')
					:
					t('syncContacts')
				}
			</Text>
			{!status.started &&
				<Text style={globals(color).modalTxt}>
					{t('syncHint')}
				</Text>
			}
			{status.started &&
				<Progress
					progress={progress}
					withIndicator
					contactsCount={contactsCount}
					doneCount={doneCount}
				/>
			}
			{(!status.started || status.finished) &&
				<Button
					txt={status.finished ? t('finished') : t('startSync')}
					onPress={handleSync}
				/>
			}
			{!status.started && !status.finished &&
				<TxtButton
					txt={t('cancel', { ns: NS.common })}
					onPress={handleCancel}
					style={[styles.cancel]}
				/>
			}
		</MyModal>
	)
}

const styles = StyleSheet.create({
	cancel: {
		paddingTop: 25,
		paddingBottom: 10
	}
})