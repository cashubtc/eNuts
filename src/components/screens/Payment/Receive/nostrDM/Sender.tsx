import Txt from '@comps/Txt'
import type { TContact } from '@model/nostr'
import { truncateAbout, truncateNpub } from '@nostr/util'
import ProfilePic from '@screens/Addressbook/ProfilePic'
import Username from '@screens/Addressbook/Username'
import { ThemeContext } from '@src/context/Theme'
import { nip19 } from 'nostr-tools'
import { useContext } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

interface ISenderProps {
	contact: TContact
	handleContactPress: () => void
}

export default function Sender({ contact, handleContactPress }: ISenderProps) {
	const { color } = useContext(ThemeContext)
	return (
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
	)
}

const styles = StyleSheet.create({
	colWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '70%'
	},
})