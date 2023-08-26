import { ChevronRightIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import type { TContact } from '@model/nostr'
import { truncateNostrProfileInfo, truncateNpub } from '@nostr/util'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { highlight as hi, mainColors } from '@styles'
import { nip19 } from 'nostr-tools'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import ProfilePic from './ProfilePic'
import Username from './Username'

interface IContactPreviewProps {
	contact: TContact
	handleContactPress: () => void
	handleSend: () => void
	isFirst: boolean
	isLast: boolean
	isPayment?: boolean
}

export default function ContactPreview({ contact, handleContactPress, handleSend, isFirst, isLast, isPayment }: IContactPreviewProps) {
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()

	return (
		<TouchableOpacity
			onPress={() => {
				if (isPayment) {
					handleContactPress()
					return
				}
				handleSend()
			}}
			disabled={!isPayment}
			style={[
				styles.container, { paddingTop: isFirst ? 10 : 0, paddingBottom: isLast ? 10 : 0 }
			]}
		>
			<TouchableOpacity
				onPress={handleContactPress}
				disabled={isPayment}
				style={styles.colWrap}
			>
				<ProfilePic uri={contact[1]?.picture} />
				{contact[1] ?
					<View>
						<Username
							displayName={contact[1].displayName}
							display_name={contact[1].display_name}
							username={contact[1].username}
							name={contact[1].name}
							npub={truncateNpub(nip19.npubEncode(contact[0]))}
							fontSize={16}
						/>
						{contact[1].about?.length > 0 &&
							<Txt
								txt={truncateNostrProfileInfo(contact[1].about)}
								styles={[{ color: color.TEXT_SECONDARY, fontSize: 14 }]}
							/>
						}
					</View>
					:
					<Txt txt={truncateNpub(nip19.npubEncode(contact[0]))} styles={[{ fontWeight: '500' }]} />
				}
			</TouchableOpacity>
			{isPayment && contact[1] ?
				<ChevronRightIcon width={16} height={16} color={color.TEXT} />
				:
				!isPayment && contact[1] ?
					<TouchableOpacity
						style={[styles.sendEcashBtn, { backgroundColor: hi[highlight] }]}
						onPress={handleSend}
					>
						<Txt txt={t('send')} styles={[styles.sendTxt]} />
					</TouchableOpacity>
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
		paddingHorizontal: 20,
	},
	colWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '70%'
	},
	sendEcashBtn: {
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 50,
	},
	sendTxt: {
		color: mainColors.WHITE,
		fontWeight: '500'
	}
})