import Txt from '@comps/Txt'
import { l } from '@log'
import type { TContact } from '@model/nostr'
import { truncateAbout, truncateNpub } from '@nostr/util'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { nip19 } from 'nostr-tools'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { type GestureResponderEvent, StyleSheet, TouchableOpacity, View } from 'react-native'

import ProfilePic from './ProfilePic'
import Username from './Username'

interface IContactPreviewProps {
	contact: TContact
	handleContactPress: () => void
}

export default function ContactPreview({ contact, handleContactPress }: IContactPreviewProps) {
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)

	const handleSend = (e: GestureResponderEvent) => {
		e.stopPropagation()
		l('send ecash')
		//
	}

	return (
		<View style={styles.container}>
			<TouchableOpacity style={styles.colWrap} onPress={handleContactPress}>
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
								txt={truncateAbout(contact[1].about)}
								styles={[{ color: color.TEXT_SECONDARY, fontSize: 14 }]}
							/>
						}
					</View>
					:
					<Txt txt={truncateNpub(nip19.npubEncode(contact[0]))} styles={[{ fontWeight: '500' }]} />
				}
			</TouchableOpacity>
			<TouchableOpacity
				style={[styles.sendEcashBtn, { backgroundColor: hi[highlight] }]}
				onPress={handleSend}
			>
				<Txt txt={t('send')} styles={[styles.sendTxt]} />
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
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
		color: '#FAFAFA',
		fontWeight: '500'
	}
})