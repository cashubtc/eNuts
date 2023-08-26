import { ChevronRightIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import type { RootStackParamList } from '@model/nav'
import type { TContact } from '@model/nostr'
import { truncateNostrProfileInfo, truncateNpub } from '@nostr/util'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import ProfilePic from '@screens/Addressbook/ProfilePic'
import Username from '@screens/Addressbook/Username'
import { useThemeContext } from '@src/context/Theme'
import { nip19 } from 'nostr-tools'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

interface ISenderProps {
	contact?: TContact
	navigation: NativeStackNavigationProp<RootStackParamList, 'nostrReceive', 'MyStack'>
}

export default function Sender({ contact, navigation }: ISenderProps) {
	const { color } = useThemeContext()

	const handleContactPress = () => {
		navigation.navigate('Contact', {
			contact: contact?.[1],
			npub: contact?.[0] || ''
		})
	}

	return (
		<TouchableOpacity
			style={styles.colWrap}
			onPress={handleContactPress}
			disabled={!contact?.[1]}
		>
			<View style={styles.picNameWrap}>
				<ProfilePic uri={contact?.[1]?.picture} />
				{contact?.[1] ?
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
					<Txt txt={truncateNpub(nip19.npubEncode(contact?.[0] || ''))} styles={[{ fontWeight: '500' }]} />
				}
			</View>
			{contact?.[1] &&
				<ChevronRightIcon color={color.TEXT} />
			}
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	colWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	picNameWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
})