import Txt from '@comps/Txt'
import type { HexKey } from '@model/nostr'
import { truncateNpub } from '@nostr/util'
import { StyleSheet } from 'react-native'

interface IUsernameProps {
	displayName?: string,
	display_name?: string,
	username?: string,
	name?: string
	npub: HexKey
	fontSize?: number
}

export default function Username({ displayName, display_name, username, name, npub, fontSize }: IUsernameProps) {
	if (displayName?.length) {
		return <Txt txt={displayName} styles={[styles.username, { fontSize: fontSize || 18 }]} />
	}
	if (display_name?.length) {
		return <Txt txt={display_name} styles={[styles.username, { fontSize: fontSize || 18 }]} />
	}
	if (username?.length) {
		return <Txt txt={username} styles={[styles.username, { fontSize: fontSize || 18 }]} />
	}
	if (name?.length) {
		return <Txt txt={name} styles={[styles.username, { fontSize: fontSize || 18 }]} />
	}
	return <Txt txt={truncateNpub(npub)} styles={[styles.username, { fontSize: fontSize || 18 }]} />
}

const styles = StyleSheet.create({
	username: {
		fontWeight: '500'
	}
})