import Button, { TxtButton } from '@comps/Button'
import { AboutIcon, DatabaseIcon, EyeClosedIcon, EyeIcon, FlagIcon, GithubIcon, HeartIcon, ImageIcon, LanguageIcon, LockIcon, MintBoardIcon, OutlinedFavIcon, PaletteIcon, PenIcon, ReadmeIcon, ShareIcon, TelegramIcon, TrashbinIcon } from '@comps/Icons'
import LeaveAppModal from '@comps/LeaveAppModal'
import MyModal from '@comps/modal'
import { ZapModal } from '@comps/modal/Zap'
import Screen from '@comps/Screen'
import Toggle from '@comps/Toggle'
import Txt from '@comps/Txt'
import { appVersion, isNotIosStore } from '@consts/env'
import { BottomModal } from '@modal/Question'
import type { TSettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { Nostr } from '@nostr/class/Nostr'
import { useNostrContext } from '@src/context/Nostr'
import { usePrivacyContext } from '@src/context/Privacy'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { dropAllData } from '@src/storage/dev'
import { isNull, share } from '@src/util'
import { secureStore, store } from '@store'
import { SECURESTORE_KEY, STORE_KEYS } from '@store/consts'
import { globals, highlight as hi, mainColors } from '@styles'
import { Image } from 'expo-image'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, Text, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

import MenuItem from './MenuItem'

export default function Settings({ navigation, route }: TSettingsPageProps) {
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const { openPromptAutoClose } = usePromptContext()
	const { hidden, handleHiddenBalance } = usePrivacyContext()
	const { resetNostrData } = useNostrContext()
	const [confirmReset, setConfirmReset] = useState(false)
	const [zapModal, setZapModal] = useState(false)
	const [visible, setVisible] = useState(false)
	const closeModal = useCallback(() => setVisible(false), [])
	const [url, setUrl] = useState('')
	const handlePress = (url: string) => {
		setVisible(true)
		setUrl(url)
	}

	const [pin, setPin] = useState<string | null>(null)
	const [hasSeed, setHasSeed] = useState(false)
	const init = async () => {
		const pinHash = await secureStore.get(SECURESTORE_KEY)
		const seed = await store.get(STORE_KEYS.hasSeed)
		setPin(isNull(pinHash) ? '' : pinHash)
		setHasSeed(!!seed)
	}

	useEffect(() => {
		void init()
	}, [])

	const [nostrModalVisible, setNostrModalVisible] = useState({
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
		setNostrModalVisible({ metadata: false, image: false, reset: false })
	}

	const handleReset = async () => {
		try {
			await dropAllData()
		} catch (e) {/* ignore */ }
		setConfirmReset(false)
	}

	return (
		<Screen
			screenName={t('settings', { ns: NS.topNav })}
			noIcons
		>
			<ScrollView alwaysBounceVertical={false} style={{ marginBottom: s(60) }} >
				{/* MINT */}
				<View style={[globals(color).wrapContainer, { marginBottom: vs(20) }]}>
					<MenuItem
						header={t('mint')}
						txt={t('mintSettings', { ns: NS.topNav })}
						icon={<MintBoardIcon color={color.TEXT} />}
						onPress={() => navigation.navigate('mints')}
					/>
				</View>
				{/* GENERAL */}
				<View style={[globals(color).wrapContainer, { marginBottom: vs(20) }]}>
					<MenuItem
						header={t('general', { ns: NS.topNav })}
						txt={t('display', { ns: NS.topNav })}
						icon={<PaletteIcon color={color.TEXT} />}
						onPress={() => navigation.navigate('Display settings')}
						hasSeparator
					/>
					<MenuItem
						txt={t('language', { ns: NS.topNav })}
						icon={<LanguageIcon color={color.TEXT} />}
						onPress={() => navigation.navigate('Language settings')}
					/>
				</View>
				{/* PRIVACY */}
				<View style={[globals(color).wrapContainer, { marginBottom: vs(20) }]}>
					<View style={[globals().wrapRow, { paddingBottom: vs(15), flexDirection: 'column', alignItems: 'flex-start' }]}>
						<Txt
							txt={t('privacy', { ns: NS.topNav })}
							styles={[{ color: hi[highlight], fontWeight: 'bold', marginBottom: vs(25) }]}
						/>
						<View style={{ flexDirection: 'row', alignItems: 'center' }}>
							<View style={styles.setting}>
								<Icon hidden={hidden.balance} />
								<Txt
									txt={t('hideNuts')}
									styles={[styles.settingTxt]}
								/>
							</View>
							<View style={{ flex: 1, alignItems: 'flex-end' }}>
								<Toggle
									value={hidden.balance}
									onChange={() => void handleHiddenBalance()}
								/>
							</View>

						</View>
					</View>
				</View>
				{/* SECURITY */}
				<View style={[globals(color).wrapContainer, { marginBottom: vs(20) }]}>
					<MenuItem
						header={t('security', { ns: NS.topNav })}
						txt={t('seedBackup')}
						icon={<FlagIcon width={s(22)} height={s(22)} color={color.TEXT} />}
						onPress={() => {
							void navigation.navigate('Seed', {
								comingFromOnboarding: false,
								sawSeedUpdate: true,
								hasSeed,
							})
						}}
						hasSeparator
					/>
					{pin ?
						<>
							<MenuItem
								txt={t('editPin', { ns: NS.auth })}
								icon={<PenIcon width={s(22)} height={s(22)} color={color.TEXT} />}
								onPress={() => navigation.navigate('auth', { pinHash: pin, shouldEdit: true })}
								hasSeparator
							/>
							<MenuItem
								txt={t('removePin', { ns: NS.auth })}
								icon={<TrashbinIcon width={s(22)} height={s(22)} color={color.TEXT} />}
								onPress={() => navigation.navigate('auth', { pinHash: pin, shouldRemove: true })}
								hasSeparator
							/>
						</>
						:
						<MenuItem
							txt={t('createPin', { ns: NS.auth })}
							icon={<LockIcon width={s(20)} height={s(20)} color={color.TEXT} />}
							onPress={() => navigation.navigate('auth', { pinHash: '' })}
						/>
					}
				</View>
				{/* NOSTR */}
				<View style={[globals(color).wrapContainer, { marginBottom: vs(20) }]}>
					<MenuItem
						header='Nostr'
						txt={t('clearMetadataCache')}
						icon={<DatabaseIcon width={s(20)} color={color.TEXT} />}
						onPress={() => setNostrModalVisible({ ...nostrModalVisible, metadata: true })}
						hasSeparator
					/>
					<MenuItem
						txt={t('clearImageCache')}
						icon={<ImageIcon width={s(20)} color={color.TEXT} />}
						onPress={() => setNostrModalVisible({ ...nostrModalVisible, image: true })}
						hasSeparator
					/>
					<MenuItem
						txt={t('submitNostrIssue')}
						icon={<TrashbinIcon width={s(20)} color={color.TEXT} />}
						onPress={() => setNostrModalVisible({ ...nostrModalVisible, reset: true })}
					/>
				</View>
				{/* ABOUT US */}
				<View style={[globals(color).wrapContainer, { marginBottom: vs(20) }]}>
					<MenuItem
						header={t('about', { ns: NS.topNav })}
						txt='FAQs'
						icon={<AboutIcon color={color.TEXT} />}
						onPress={() => handlePress('https://www.enuts.cash/faqs#overview')}
						hasSeparator={isNotIosStore}
					/>
					<MenuItem
						txt={t('readme')}
						icon={<ReadmeIcon color={color.TEXT} />}
						onPress={() => handlePress('https://github.com/cashubtc/eNuts#readme')}
						hasSeparator
					/>
					<MenuItem
						txt={t('githubIssues')}
						icon={<GithubIcon color={color.TEXT} />}
						onPress={() => handlePress('https://github.com/cashubtc/eNuts/issues/new/choose')}
						hasSeparator
					/>
					<MenuItem
						txt={t('enutsRandD')}
						icon={<TelegramIcon color={color.TEXT} />}
						onPress={() => handlePress('https://t.me/eNutsWallet')}
					/>
				</View>
				{/* SUPPORT US */}
				<View style={[globals(color).wrapContainer, { marginBottom: vs(20) }]}>
					<MenuItem
						header='Support us'
						txt='Share eNuts with someone'
						icon={<ShareIcon color={mainColors.VALID} />}
						onPress={() => void share('Try out this Cashu Lightning Wallet called eNuts! https://www.enuts.cash/get-started#why-enuts', 'https://www.enuts.cash/get-started#why-enuts')}
						hasSeparator={isNotIosStore}
					/>
					<MenuItem
						txt={t('leaveGithubStar')}
						icon={<OutlinedFavIcon color={mainColors.ZAP} />}
						onPress={() => handlePress('https://github.com/cashubtc/eNuts')}
						hasSeparator={isNotIosStore}
					/>
					{isNotIosStore &&
						<MenuItem
							txt={t('donateLn')}
							icon={<HeartIcon color={mainColors.ERROR} />}
							onPress={() => setZapModal(true)}
						/>
					}
				</View>
				{__DEV__ &&
					<View style={[globals(color).wrapContainer, { marginBottom: vs(20) }]}>
						<MenuItem
							header='DEV'
							txt={t('factoryReset')}
							icon={<Text>💥💥💥</Text>}
							onPress={() => setConfirmReset(true)}
						/>
					</View>
				}
				<Txt txt={appVersion} bold center />
			</ScrollView>
			<BottomNav navigation={navigation} route={route} />
			<ZapModal visible={zapModal} close={() => setZapModal(false)} />
			{/* confirm factory reset */}
			<BottomModal
				header={t('resetQ')}
				txt={t('delHistoryTxt')}
				visible={confirmReset}
				confirmTxt={t('yes')}
				confirmFn={() => void handleReset()}
				cancelTxt={t('no')}
				cancelFn={() => setConfirmReset(false)}
			/>
			{/* metadata cache */}
			<MyModal type='bottom' animation='slide' visible={nostrModalVisible.metadata} close={onCancel}>
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
			<MyModal type='bottom' animation='slide' visible={nostrModalVisible.image} close={onCancel}>
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
			<MyModal type='bottom' animation='slide' visible={nostrModalVisible.reset} close={onCancel}>
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
			<LeaveAppModal url={url} visible={visible} closeModal={closeModal} />
		</Screen>
	)
}

function Icon({ hidden }: { hidden?: boolean }) {
	const { color } = useThemeContext()
	return hidden ? <EyeClosedIcon color={color.TEXT} /> : <EyeIcon color={color.TEXT} />
}

const styles = ScaledSheet.create({
	setting: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	settingTxt: {
		marginLeft: '15@s',
	},
	cancelBtn: {
		paddingTop: '25@vs',
		paddingBottom: '10@vs',
	}
})