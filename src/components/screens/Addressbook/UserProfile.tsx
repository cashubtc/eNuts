import { ChevronRightIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import type { IProfileContent } from '@model/nostr'
import { truncateAbout } from '@nostr/util'
import { ThemeContext } from '@src/context/Theme'
import { globals, highlight as hi } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import ProfilePic from './ProfilePic'
import Username from './Username'

interface IUserProfileProps {
	pubKey: { encoded: string, hex: string }
	userProfile?: IProfileContent
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

export default function UserProfile({ pubKey, userProfile, handlePress }: IUserProfileProps) {
	const { t } = useTranslation()
	const { color, highlight } = useContext(ThemeContext)
	return (
		<TouchableOpacity
			style={[globals(color).wrapContainer, styles.bookEntry, styles.userEntryContainer]}
			onPress={() => handlePress({ isUser: true })}
		>
			<View style={styles.picNameWrap}>
				<ProfilePic uri={userProfile?.picture} withPlusIcon={!pubKey.hex} isUser />
				{pubKey.hex.length ?
					<View>
						<Username
							displayName={userProfile?.displayName}
							display_name={userProfile?.display_name}
							username={userProfile?.username}
							name={userProfile?.name}
							npub={pubKey.encoded}
						/>
						<Txt txt={truncateAbout(userProfile?.about || '')} styles={[{ color: color.TEXT_SECONDARY }]} />
					</View>
					:
					<Txt txt={t('addOwnLnurl', { ns: 'addrBook' })} styles={[{ color: hi[highlight] }]} />
				}
			</View>
			{userProfile ?
				<ChevronRightIcon color={color.TEXT} />
				:
				<View />
			}
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