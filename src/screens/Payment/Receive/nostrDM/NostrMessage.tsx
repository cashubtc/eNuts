import Separator from '@comps/Separator'
import type { TNostrReceivePageProps } from '@model/nav'
import type { INostrDm, TContact } from '@model/nostr'
import EntryTime from '@screens/History/entryTime'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'

import MsgContent from './MsgContent'
import Sender from './Sender'

interface INostrMessageProps {
	msgEntry: INostrDm
	sender?: TContact
	dms: INostrDm[]
	setDms: (newDms: INostrDm[]) => void
	mints: string[]
	nav: TNostrReceivePageProps
}

export default function NostrMessage({ msgEntry, sender, dms, setDms, mints, nav }: INostrMessageProps) {
	const { t } = useTranslation([NS.history])
	const { color } = useThemeContext()
	return (
		<View style={[globals(color).wrapContainer, styles.msgContainer]}>
			<Sender contact={sender} navigation={nav.navigation} />
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