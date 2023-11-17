import { ChevronRightIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import type { RootStackParamList } from '@model/nav'
import type { IContact } from '@model/nostr'
import { truncateStr } from '@nostr/util'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import ProfilePic from '@screens/Addressbook/ProfilePic'
import Username from '@screens/Addressbook/Username'
import { useThemeContext } from '@src/context/Theme'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

interface ISenderProps {
	contact?: IContact
	navigation: NativeStackNavigationProp<RootStackParamList, 'nostrReceive', 'MyStack'>
}

export default function Sender({ contact, navigation }: ISenderProps) {
	const { color } = useThemeContext()

	const handleContactPress = () => navigation.navigate('Contact', { contact })

	return (
		<TouchableOpacity
			style={styles.colWrap}
			onPress={handleContactPress}
		>
			<View style={styles.picNameWrap}>
				<ProfilePic
					hex={contact?.hex}
					uri={contact?.picture}
				/>
				{contact &&
					<View>
						<Username contact={contact} fontSize={16} />
						{contact.about && contact.about.length > 0 &&
							<Txt
								txt={truncateStr(contact.about)}
								styles={[{ color: color.TEXT_SECONDARY, fontSize: 14 }]}
							/>
						}
					</View>
				}
			</View>
			<ChevronRightIcon color={color.TEXT} />
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