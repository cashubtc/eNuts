import Button, { TxtButton } from '@comps/Button'
import { TrashbinIcon } from '@comps/Icons'
import MyModal from '@comps/modal'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { TNostrSettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { Nostr } from '@src/nostr/class/Nostr'
import { globals } from '@styles'
import { Image } from 'expo-image'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function NostrSettings({ navigation, route }: TNostrSettingsPageProps) {
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const { openPromptAutoClose } = usePromptContext()
	const [visible, setVisible] = useState({
		metadata: false,
		image: false,
	})

	const handleNostrCache = async () => {
		await Nostr.cleanCache()
		onCancel()
		openPromptAutoClose({ msg: 'Metadata cache cleared', success: true })
	}

	const handleImageCache = async () => {
		const success = await Image.clearDiskCache()
		onCancel()
		openPromptAutoClose({ msg: success ? 'Image cache cleared' : 'Everything is clear!', success })
	}

	const onCancel = () => {
		setVisible({ metadata: false, image: false })
	}

	return (
		<Screen
			screenName='Nostr'
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<ScrollView>
				<View style={globals(color).wrapContainer}>
					<TouchableOpacity style={globals().wrapRow} onPress={() => setVisible(prev => ({ ...prev, metadata: true }))}>
						<View style={styles.iconWrap}>
							<TrashbinIcon color={color.TEXT} />
							<Txt txt={t('clearMetadataCache')} styles={[styles.optTxt]} />
						</View>
					</TouchableOpacity>
					<Separator />
					<TouchableOpacity style={globals().wrapRow} onPress={() => setVisible(prev => ({ ...prev, image: true }))}>
						<View style={styles.iconWrap}>
							<TrashbinIcon color={color.TEXT} />
							<Txt txt={t('clearImageCache')} styles={[styles.optTxt]} />
						</View>
					</TouchableOpacity>
				</View>
			</ScrollView>
			<BottomNav navigation={navigation} route={route} />
			{/* metadata cache */}
			<MyModal type='bottom' animation='slide' visible={visible.metadata} close={onCancel}>
				<Text style={globals(color, highlight).modalHeader}>
					{t('clearMetadataCache')}
				</Text>
				<Text style={globals(color, highlight).modalTxt}>
					{t('clearMetadataCacheHint')}
				</Text>
				<Button txt={t('yes')} onPress={() => void handleNostrCache()} />
				<TxtButton
					txt={t('no')}
					onPress={onCancel}
					style={[styles.cancelBtn]}
				/>
			</MyModal>
			{/* image cache */}
			<MyModal type='bottom' animation='slide' visible={visible.image} close={onCancel}>
				<Text style={globals(color, highlight).modalHeader}>
					{t('clearImageCache')}
				</Text>
				<Text style={globals(color, highlight).modalTxt}>
					{t('clearImageCacheHint')}
				</Text>
				<Button txt={t('yes')} onPress={() => void handleImageCache()} />
				<TxtButton
					txt={t('no')}
					onPress={onCancel}
					style={[styles.cancelBtn]}
				/>
			</MyModal>
		</Screen >
	)
}

const styles = StyleSheet.create({
	cancelBtn: {
		paddingTop: 25,
		paddingBottom: 10,
	},
	iconWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	optTxt: {
		marginLeft: 15
	}
})