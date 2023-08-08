import Separator from '@comps/Separator'
import { l } from '@log'
import type { INostrDm } from '@model/nostr'
import EntryTime from '@screens/History/entryTime'
import { useThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'

import MsgContent from './MsgContent'
import Sender from './Sender'

interface INostrMessageProps {
	msgEntry: INostrDm
	dms: INostrDm[]
	setDms: (newDms: INostrDm[]) => void
	mints: string[]
}

export default function NostrMessage({ msgEntry, dms, setDms, mints }: INostrMessageProps) {
	const { t } = useTranslation(['history'])
	const { color } = useThemeContext()
	return (
		<View style={[globals(color).wrapContainer, styles.msgContainer]}>
			<Sender contact={[msgEntry.sender, undefined]} handleContactPress={() => l('')} />
			<Separator style={[styles.separator]} />
			<MsgContent msgEntry={msgEntry} dms={dms} setDms={setDms} mints={mints} />
			<Text style={{ color: color.TEXT_SECONDARY }}>
				<EntryTime from={msgEntry.created_at * 1000} fallback={t('justNow')} />
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	msgContainer: {
		paddingVertical: 10,
		marginBottom: 20,
	},
	separator: {
		marginTop: 10,
		marginBottom: 20,
	}
})