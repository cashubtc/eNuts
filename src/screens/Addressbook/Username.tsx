import Txt from '@comps/Txt'
import type { HexKey } from '@model/nostr'
import { truncateNostrProfileInfo, truncateNpub } from '@nostr/util'
import { StyleSheet } from 'react-native'

interface IUsernameProps {
	displayName?: string,
	display_name?: string,
	username?: string,
	name?: string
	npub: HexKey
	fontSize?: number
	shouldTruncate?: boolean
}

export default function Username({ displayName, display_name, username, name, npub, fontSize, shouldTruncate }: IUsernameProps) {
	const maxLength = shouldTruncate ? 20 : 100
	if (displayName?.length) {
		return <Txt
			txt={truncateNostrProfileInfo(displayName, maxLength)}
			styles={[styles.username, { fontSize: fontSize || 18 }]}
		/>
	}
	if (display_name?.length) {
		return <Txt
			txt={truncateNostrProfileInfo(display_name, maxLength)}
			styles={[styles.username, { fontSize: fontSize || 18 }]}
		/>
	}
	if (username?.length) {
		return <Txt
			txt={truncateNostrProfileInfo(username, maxLength)}
			styles={[styles.username, { fontSize: fontSize || 18 }]}
		/>
	}
	if (name?.length) {
		return <Txt
			txt={truncateNostrProfileInfo(name, maxLength)}
			styles={[styles.username, { fontSize: fontSize || 18 }]}
		/>
	}
	return <Txt
		txt={truncateNpub(npub)}
		styles={[styles.username, { fontSize: fontSize || 18 }]}
	/>
}

const styles = StyleSheet.create({
	username: {
		fontWeight: '500'
	}
})