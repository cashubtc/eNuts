import { ChevronRightIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import type { RootStackParamList } from '@model/nav'
import type { TContact } from '@model/nostr'
import { truncateNpub,truncateStr } from '@nostr/util'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import ProfilePic from '@screens/Addressbook/ProfilePic'
import Username from '@screens/Addressbook/Username'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { nip19 } from 'nostr-tools'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

interface ISenderProps {
	contact?: TContact
	navigation: NativeStackNavigationProp<RootStackParamList, 'nostrReceive', 'MyStack'>
}

export default function Sender({ contact, navigation }: ISenderProps) {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()

	const handleContactPress = () => {
		navigation.navigate('Contact', {
			contact: contact?.[1],
			hex: contact?.[0] || ''
		})
	}

	return (
		<TouchableOpacity
			style={styles.colWrap}
			onPress={handleContactPress}
			disabled={!contact?.[1]}
		>
			<View style={styles.picNameWrap}>
				<ProfilePic
					hex={contact?.[0] || ''}
					uri={contact?.[1]?.picture}
					recyclingKey={contact?.[0]}
				/>
				{contact?.[1] ?
					<View>
						<Username contact={contact} fontSize={16} />
						{contact[1].about && contact[1].about.length > 0 &&
							<Txt
								txt={truncateStr(contact[1].about)}
								styles={[{ color: color.TEXT_SECONDARY, fontSize: 14 }]}
							/>
						}
					</View>
					:
					<Txt
						txt={contact && contact[0].length ? truncateNpub(nip19.npubEncode(contact[0])) : t('invalidPubKey')}
						styles={[{ fontWeight: '500' }]}
					/>
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