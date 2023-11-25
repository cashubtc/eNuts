import type { IContact } from '@model/nostr'
import { FlashList } from '@shopify/flash-list'
import { useNostrContext } from '@src/context/Nostr'
import { useThemeContext } from '@src/context/Theme'
import { TouchableOpacity } from 'react-native'
import { s, vs } from 'react-native-size-matters'

import ProfilePic from './ProfilePic'

interface IRecentsProps {
	handleSend: (item: IContact) => Promise<void>
}

export default function Recents({ handleSend }: IRecentsProps) {
	const { color } = useThemeContext()
	const { favs, recent } = useNostrContext().nostr
	return (
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
					/>
				</TouchableOpacity>
			)}
			contentContainerStyle={{
				paddingVertical: vs(10),
				paddingLeft: s(20),
				paddingRight: 0,
			}}
		/>
	)
}
