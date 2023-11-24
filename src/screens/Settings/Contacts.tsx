import Button, { TxtButton } from '@comps/Button'
import { DatabaseIcon, ImageIcon, TrashbinIcon } from '@comps/Icons'
import MyModal from '@comps/modal'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { TNostrSettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { Nostr } from '@nostr/class/Nostr'
import { useNostrContext } from '@src/context/Nostr'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, mainColors } from '@styles'
import { Image } from 'expo-image'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { ScaledSheet, vs } from 'react-native-size-matters'

export default function ContactsSettings({ navigation, route }: TNostrSettingsPageProps) {
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const { openPromptAutoClose } = usePromptContext()
	const { resetNostrData } = useNostrContext()
	const [visible, setVisible] = useState({
		metadata: false,
		image: false,
		reset: false
	})

	const handleNostrCache = async () => {
		await Nostr.cleanCache()
		onCancel()
		openPromptAutoClose({ msg: t('metadataCacheCleared'), success: true })
	}

	const handleImageCache = async () => {
		const success = await Image.clearDiskCache()
		onCancel()
		openPromptAutoClose({ msg: success ? t('imageCacheCleared') : t('clearOverHere'), success })
	}

	const handleResetData = async () => {
		await resetNostrData()
		onCancel()
		openPromptAutoClose({ msg: t('nostrIssueSuccess'), success: true })
	}

	const onCancel = () => {
		setVisible({ metadata: false, image: false, reset: false })
	}

	return (
		<Screen
			screenName={t('contacts', { ns: NS.bottomNav })}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<ScrollView>
				<View style={globals(color).wrapContainer}>
					<TouchableOpacity style={[globals().wrapRow, {paddingBottom: vs(15)}]} onPress={() => setVisible(prev => ({ ...prev, metadata: true }))}>
						<View style={styles.iconWrap}>
							<DatabaseIcon color={color.TEXT} />
							<Txt txt={t('clearMetadataCache')} styles={[styles.optTxt]} />
						</View>
					</TouchableOpacity>
					<Separator style={[styles.separator]} />
					<TouchableOpacity style={[globals().wrapRow, {paddingBottom: vs(15)}]} onPress={() => setVisible(prev => ({ ...prev, image: true }))}>
						<View style={styles.iconWrap}>
							<ImageIcon color={color.TEXT} />
							<Txt txt={t('clearImageCache')} styles={[styles.optTxt]} />
						</View>
					</TouchableOpacity>
					<Separator style={[styles.separator]} />
					<TouchableOpacity style={[globals().wrapRow, {paddingBottom: vs(15)}]} onPress={() => setVisible(prev => ({ ...prev, reset: true }))}>
						<View style={styles.iconWrap}>
							<TrashbinIcon color={mainColors.ERROR} />
							<Txt txt={t('submitNostrIssue')} styles={[styles.optTxt, { color: mainColors.ERROR }]} />
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
			{/* reset data */}
			<MyModal type='bottom' animation='slide' visible={visible.reset} close={onCancel}>
				<Text style={globals(color, highlight).modalHeader}>
					{t('submitNostrIssue')}
				</Text>
				<Text style={globals(color, highlight).modalTxt}>
					{t('delNpubHint')}
				</Text>
				<Button txt={t('yes')} onPress={() => void handleResetData()} />
				<TxtButton
					txt={t('no')}
					onPress={onCancel}
					style={[styles.cancelBtn]}
				/>
			</MyModal>
		</Screen >
	)
}

const styles = ScaledSheet.create({
	cancelBtn: {
		paddingTop: '25@vs',
		paddingBottom: '10@vs',
	},
	iconWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	optTxt: {
		marginLeft: '15@s'
	},
	separator: {
		marginBottom: '15@vs'
	}
})