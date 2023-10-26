import Txt from '@comps/Txt'
import type { TContact } from '@model/nostr'
import { getNostrUsername, truncateNpub,truncateStr } from '@nostr/util'
import { NS } from '@src/i18n'
import { nip19 } from 'nostr-tools'
import { useTranslation } from 'react-i18next'

interface IUsernameProps {
	contact?: TContact
	fontSize?: number
}

export default function Username({ contact, fontSize }: IUsernameProps) {
	const { t } = useTranslation([NS.common])
	const txtStyle = [{ fontSize: fontSize || 18 }]
	const n = getNostrUsername(contact?.[1])
	if (n?.length) {
		return <Txt
			txt={truncateStr(n)}
			bold
			styles={txtStyle}
		/>
	}
	if (!contact?.[0].length) { return 'N/A' }
	return <Txt
		txt={contact[0].length ? truncateNpub(nip19.npubEncode(contact[0])) : t('n/a')}
		styles={txtStyle}
	/>
}
