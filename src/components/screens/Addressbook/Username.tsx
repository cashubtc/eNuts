import Txt from '@comps/Txt'
import type { HexKey } from '@model/nostr'
import { truncateNpub } from '@nostr/util'
import { StyleSheet } from 'react-native'

interface IUsernameProps {
	displayName?: string,
	username?: string,
	npub: HexKey
	fontSize?: number
}

export default function Username({ displayName, username, npub, fontSize }: IUsernameProps) {
	if (displayName?.length && !username?.length) {
		return <Txt txt={displayName} styles={[styles.username, { fontSize: fontSize || 18 }]} />
	}
	if (!displayName?.length && username?.length) {
		return <Txt txt={username} styles={[styles.username, { fontSize: fontSize || 18 }]} />
	}
	return <Txt txt={truncateNpub(npub)} styles={[styles.username, { fontSize: fontSize || 18 }]} />
}

const styles = StyleSheet.create({
	username: {
		fontWeight: '500'
	}
})