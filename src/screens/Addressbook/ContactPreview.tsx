import useCopy from '@comps/hooks/Copy'
import { ChevronRightIcon, CopyIcon, ListFavIcon } from '@comps/Icons'
import Popup from '@comps/Popup'
import Txt from '@comps/Txt'
import type { IContact } from '@model/nostr'
import { truncateNpub, truncateStr } from '@nostr/util'
import { useNostrContext } from '@src/context/Nostr'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { highlight as hi, mainColors } from '@styles'
import { nip19 } from 'nostr-tools'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import ProfilePic from './ProfilePic'
import Username from './Username'

interface IContactPreviewProps {
	contact: IContact
	openProfile: () => void
	handleSend: () => void
	isPayment?: boolean
	isFav?: boolean
	isSearchResult?: boolean
	isInContacts?: boolean
	recyclingKey?: string
}

export default function ContactPreview({
	contact,
	openProfile,
	handleSend,
	isPayment,
	isFav,
	isSearchResult,
	isInContacts,
	recyclingKey
}: IContactPreviewProps) {
	const { t } = useTranslation([NS.addrBook])
	const { color, highlight } = useThemeContext()
	const { favs, setFavs } = useNostrContext()
	const { copy } = useCopy()
	const { openPromptAutoClose } = usePromptContext()

	const handleFav = () => {
		let newFavs: string[] = []
		if (favs.includes(contact.hex)) {
			setFavs(prev => {
				newFavs = prev.filter(fav => fav !== contact.hex)
				return newFavs
			})
		} else {
			setFavs(prev => {
				newFavs = [...prev, contact.hex]
				return newFavs
			})
		}
		void store.setObj(STORE_KEYS.favs, newFavs)
	}

	const handleCopy = async () => {
		await copy(contact.hex)
		openPromptAutoClose({ msg: t('npubCopied'), success: true })
	}

	const opts = [
		{
			txt: isFav ? t('removeFav') : t('favorite'),
			onSelect: handleFav,
			icon: <ListFavIcon width={20} height={20} color={isFav ? color.TEXT : mainColors.STAR} />,
			hasSeparator: true
		},
		{
			txt: t('showProfile'),
			onSelect: openProfile,
			icon: <ChevronRightIcon width={16} height={16} color={color.TEXT} />,
			hasSeparator: true
		},
		{
			txt: t('copyNpub'),
			onSelect: () => void handleCopy(),
			icon: <CopyIcon width={18} height={18} color={color.TEXT} />,
		},
	]

	return (
		<TouchableOpacity onPress={handleSend} style={[styles.container]}>
			<View style={styles.colWrap}>
				<ProfilePic
					hex={contact.hex}
					size={50}
					uri={contact.picture}
					overlayColor={color.INPUT_BG}
					// isVerified={!!contact[1]?.nip05?.length}
					isFav={isFav}
					isInContacts={isSearchResult && isInContacts}
					recyclingKey={recyclingKey}
				/>
				{Object.keys(contact).length > 1 ?
					<View style={styles.nameWrap}>
						<Username contact={contact} fontSize={16} />
						{contact?.nip05 &&
							<Txt
								txt={truncateStr(contact.nip05, 25)}
								styles={[{ color: hi[highlight], fontSize: 12 }]}
							/>
						}
					</View>
					:
					<Txt
						txt={contact.hex.length ? truncateNpub(nip19.npubEncode(contact.hex)) : t('n/a', { ns: NS.common })}
						bold
					/>
				}
			</View>
			{Object.keys(contact).length > 1 ?
				isPayment ?
					<ChevronRightIcon width={16} height={16} color={color.TEXT} />
					:
					<Popup opts={isSearchResult && !isInContacts ? opts.slice(1) : opts} />
				:
				null
			}
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginHorizontal: 20,
		paddingVertical: 10,
	},
	colWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '70%'
	},
	nameWrap: {
		width: '100%'
	},
})