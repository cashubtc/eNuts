
import Txt from '@comps/Txt'
import type { INostrDm, TContact } from '@model/nostr'
import { View } from 'react-native'

import Token from './Token'

interface INostrMessageProps {
	sender?: TContact
	msgEntry: INostrDm
	dms: INostrDm[]
	setDms: (newDms: INostrDm[]) => void
	mints: string[]
}

export default function MsgContent({ sender, msgEntry, dms, setDms, mints }: INostrMessageProps) {

	const { msg, token, id } = msgEntry
	const tokenStart = msg.indexOf(token)
	const tokenEnd = tokenStart + token.length
	const firstPart = msg.slice(0, tokenStart)
	const tokenPart = msg.slice(tokenStart, tokenEnd)
	const lastPart = msg.slice(tokenEnd)

	return (
		<View style={{ marginBottom: 20 }}>
			{firstPart.length > 0 && <Txt txt={firstPart} />}
			<Token sender={sender} token={tokenPart} id={id} dms={dms} setDms={setDms} mints={mints} />
			{lastPart.length > 0 && <Txt txt={lastPart} />}
		</View>
	)
}