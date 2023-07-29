import useNostrProfile from '@comps/hooks/NostrProfile'
import { ChevronRightIcon } from '@comps/Icons'
import type { HexKey } from '@model/nostr'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { useInView } from 'react-intersection-observer'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import ProfilePic from './ProfilePic'
import Username from './Username'

interface IContactPreviewProps {
	pubKey: HexKey
	handleContactPress: () => void
}

export default function ContactPreview({ pubKey, handleContactPress }: IContactPreviewProps) {
	const { inView } = useInView({ triggerOnce: true })
	const { color } = useContext(ThemeContext)
	const { profile } = useNostrProfile({ pubKey: inView ? pubKey : undefined })

	return (
		<TouchableOpacity
			style={[globals(color).wrapContainer, styles.bookEntry, styles.userEntryContainer]}
			onPress={handleContactPress}
		>
			<View style={styles.picNameWrap}>
				<ProfilePic uri={profile?.picture} />
				<Username displayName={profile?.displayName} username={profile?.username} npub={pubKey} />
			</View>
			<View />
			{profile ?
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
		alignItems: 'center',
	}
})