import { ChevronRightIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import type { IProfileContent } from '@model/nostr'
import { truncateNostrProfileInfo } from '@nostr/util'
import { useNostrContext } from '@src/context/Nostr'
import { useThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import ProfilePic from './ProfilePic'
import Username from './Username'

interface IUserProfileProps {
	handlePress: ({
		contact,
		npub,
		isUser
	}: {
		contact?: IProfileContent,
		npub?: string,
		isUser?: boolean
	}) => void
}

export default function UserProfile({ handlePress }: IUserProfileProps) {
	const { pubKey, userProfile } = useNostrContext()
	const { color } = useThemeContext()
	if (!userProfile) { return null }
	return (
		<TouchableOpacity
			style={[globals(color).wrapContainer, styles.bookEntry, styles.userEntryContainer]}
			onPress={() => handlePress({ isUser: true })}
		>
			<View style={styles.picNameWrap}>
				<ProfilePic uri={userProfile.picture} withPlusIcon={!pubKey.hex} isUser />
				<View>
					<Username
						displayName={userProfile.displayName}
						display_name={userProfile.display_name}
						username={userProfile.username}
						name={userProfile.name}
						npub={pubKey.encoded}
					/>
					{userProfile.about &&
						<Txt txt={truncateNostrProfileInfo(userProfile.about, 25)} styles={[{ color: color.TEXT_SECONDARY }]} />
					}
				</View>
			</View>
			<ChevronRightIcon color={color.TEXT} />
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	bookEntry: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginVertical: 8,
	},
	userEntryContainer: {
		paddingVertical: 9,
		marginBottom: 25,
	},
	picNameWrap: {
		flexDirection: 'row',
		alignItems: 'center'
	}
})