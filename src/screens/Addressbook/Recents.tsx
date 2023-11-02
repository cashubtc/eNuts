import Separator from '@comps/Separator'
import type { IContact } from '@model/nostr'
import { FlashList } from '@shopify/flash-list'
import { useNostrContext } from '@src/context/Nostr'
import { useThemeContext } from '@src/context/Theme'
import { StyleSheet, TouchableOpacity } from 'react-native'

import ProfilePic from './ProfilePic'

interface IRecentsProps {
	showSearch?: boolean
	handleSend: (item: IContact) => Promise<void>
}

export default function Recents({ showSearch, handleSend }: IRecentsProps) {
	const { color } = useThemeContext()
	const { favs, recent } = useNostrContext()
	return (
		<>
			<FlashList
				data={recent}
				horizontal
				estimatedItemSize={50}
				keyExtractor={item => item.hex}
				renderItem={({ item }) => (
					<TouchableOpacity onPress={() => void handleSend(item)}>
						<ProfilePic
							hex={item.hex}
							size={50}
							uri={item.picture}
							overlayColor={color.INPUT_BG}
							isFav={favs.includes(item.hex)}
							recyclingKey={item.hex}
						/>
					</TouchableOpacity>
				)}
				contentContainerStyle={styles.recentList}
			/>
			{!showSearch && <Separator style={[{ marginTop: 10, marginBottom: 0 }]} />}
		</>
	)
}

const styles = StyleSheet.create({
	recentList: {
		paddingVertical: 10,
		paddingLeft: 20,
		paddingRight: 0,
	}
})