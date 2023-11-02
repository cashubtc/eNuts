import useCopy from '@comps/hooks/Copy'
import { ChevronRightIcon, CopyIcon, ListFavIcon } from '@comps/Icons'
import Popup from '@comps/Popup'
import Txt from '@comps/Txt'
import type { IProfileContent, TContact } from '@model/nostr'
import { truncateNpub, truncateStr } from '@nostr/util'
import { useNostrContext } from '@src/context/Nostr'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { highlight as hi, mainColors } from '@styles'
import { nip19 } from 'nostr-tools'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import ProfilePic from './ProfilePic'
import Username from './Username'

interface IContactPreviewProps {
	contact: TContact | [string, Partial<IProfileContent>]
	openProfile: () => void
	handleSend: () => void
	isPayment?: boolean
	isFav?: boolean
	isSearchResult?: boolean
	recyclingKey?: string
}

export default function ContactPreview({
	contact,
	openProfile,
	handleSend,
	isPayment,
	isFav,
	isSearchResult,
	recyclingKey
}: IContactPreviewProps) {
	const { t } = useTranslation([NS.addrBook])
	const { color, highlight } = useThemeContext()
	const { favs, setFavs } = useNostrContext()
	const { copy } = useCopy()
	const { openPromptAutoClose } = usePromptContext()

	const handleFav = useCallback(() => {
		let newFavs: string[] = []
		if (favs.includes(contact[0])) {
			setFavs(prev => {
				newFavs = prev.filter(fav => fav !== contact[0])
				return newFavs
			})
		} else {
			setFavs(prev => {
				newFavs = [...prev, contact[0]]
				return newFavs
			})
		}
		void store.setObj(STORE_KEYS.favs, newFavs)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [favs])

	const handleCopy = async () => {
		await copy(contact[0])
		openPromptAutoClose({ msg: t('npubCopied'), success: true })
	}

	const opts = useMemo(() => [
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
	// eslint-disable-next-line react-hooks/exhaustive-deps
	], [contact])

	return (
		<TouchableOpacity onPress={handleSend} style={[styles.container]}>
			<View style={styles.colWrap}>
				<ProfilePic
					hex={contact[0]}
					size={50}
					uri={contact[1]?.picture}
					overlayColor={color.INPUT_BG}
					// isVerified={!!contact[1]?.nip05?.length}
					isFav={isFav}
					recyclingKey={recyclingKey}
				/>
				{contact[1] ?
					<View style={styles.nameWrap}>
						<Username contact={contact} fontSize={16} />
						{contact?.[1]?.nip05 &&
							<Txt
								txt={truncateStr(contact[1].nip05, 25)}
								styles={[{ color: hi[highlight], fontSize: 12 }]}
							/>
						}
					</View>
					:
					<Txt
						txt={contact[0].length ? truncateNpub(nip19.npubEncode(contact[0])) : t('n/a', { ns: NS.common })}
						bold
					/>
				}
			</View>
			{contact[1] ?
				isPayment ?
					<ChevronRightIcon width={16} height={16} color={color.TEXT} />
					:
					<Popup opts={isSearchResult ? opts.slice(1) : opts} />
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