import Txt from '@comps/Txt'
import type { IContact } from '@model/nostr'
import { getNostrUsername, truncateNpub,truncateStr } from '@nostr/util'
import { NS } from '@src/i18n'
import { nip19 } from 'nostr-tools'
import { useTranslation } from 'react-i18next'

interface IUsernameProps {
	contact?: IContact
	fontSize?: number
}

export default function Username({ contact, fontSize }: IUsernameProps) {
	const { t } = useTranslation([NS.common])
	const txtStyle = [{ fontSize: fontSize || 18 }]
	const n = getNostrUsername(contact)
	if (n?.length) {
		return <Txt
			txt={truncateStr(n)}
			bold
			styles={txtStyle}
		/>
	}
	if (!contact?.hex.length) { return 'N/A' }
	return <Txt
		txt={contact.hex.length ? truncateNpub(nip19.npubEncode(contact.hex)) : t('n/a')}
		styles={txtStyle}
	/>
}
